import { NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import type { TutorReply } from "@/lib/types";

export const runtime = "nodejs";

const TUTOR_MODEL = process.env.OPENAI_TUTOR_MODEL ?? "gpt-4.1-mini";

const tutorResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "grammar",
    "vocabulary",
    "natural_expression",
    "fluency_score",
    "suggested_response",
    "follow_up_question",
    "coaching_plan",
    "micro_practice",
    "focus_training"
  ],
  properties: {
    grammar: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "string",
        description: "One short grammar correction or grammar tip."
      }
    },
    vocabulary: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["word", "meaning", "example"],
        properties: {
          word: { type: "string" },
          meaning: {
            type: "string",
            description: "A simple meaning of the word or phrase."
          },
          example: {
            type: "string",
            description: "A short example sentence using the word or phrase."
          }
        }
      }
    },
    natural_expression: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "string",
        description: "A clearer or more natural B1-level expression the student can use."
      }
    },
    fluency_score: {
      type: "number",
      minimum: 1,
      maximum: 10
    },
    suggested_response: {
      type: "string",
      description: "A concise B1-level response the student could say next time."
    },
    follow_up_question: {
      type: "string",
      enum: ["Can you try again using my suggestions?"],
      description: "The exact follow-up question that invites the student to retry."
    },
    coaching_plan: {
      type: "object",
      additionalProperties: false,
      required: ["what_to_fix", "what_to_practice_next", "targeted_drills"],
      properties: {
        what_to_fix: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "string",
            description: "A specific weakness to fix next."
          }
        },
        what_to_practice_next: {
          type: "string",
          description: "The next speaking skill the student should practise."
        },
        targeted_drills: {
          type: "array",
          minItems: 2,
          maxItems: 3,
          items: {
            type: "string",
            description: "A short targeted drill the student can do immediately."
          }
        }
      }
    },
    micro_practice: {
      type: "object",
      additionalProperties: false,
      required: ["sentence", "instruction"],
      properties: {
        sentence: {
          type: "string",
          description: "A short sentence for the student to repeat or improve."
        },
        instruction: {
          type: "string",
          description: "A short instruction for how to practise the sentence."
        }
      }
    },
    focus_training: {
      type: "object",
      additionalProperties: false,
      required: ["weakness", "next_question"],
      properties: {
        weakness: {
          type: "string",
          enum: ["grammar issue", "vocabulary limitation", "sentence structure"],
          description: "The main weakness detected in the student's answer."
        },
        next_question: {
          type: "string",
          description: "An adaptive follow-up question targeting the detected weakness."
        }
      }
    }
  }
};

type ResponsesApiResult = {
  output_text?: string;
  output?: {
    content?: {
      text?: string;
    }[];
  }[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    scenarioId?: string;
    transcript?: string;
    attemptNumber?: number;
    previousAttempts?: {
      transcript: string;
      fluency_score: number;
    }[];
    learningMemory?: {
      topIssues?: string[];
      weakAreas?: string[];
      overusedWords?: string[];
    };
  };

  const transcript = body.transcript?.trim() ?? "";

  if (!transcript) {
    return NextResponse.json(
      {
        error: "Transcript is required."
      },
      { status: 400 }
    );
  }

  const scenario = getScenario(body.scenarioId ?? null);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(createMockTutorReply(scenario.title));
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: TUTOR_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are a supportive English speaking coach for international students at a UK university. Use B1-B2 level English. Be friendly, concise, practical, and focused on correction. Encourage retrying and improvement."
        },
        {
          role: "user",
          content: [
            `Scenario: ${scenario.title}`,
            `Practice prompt: ${scenario.prompt}`,
            `Attempt number: ${body.attemptNumber ?? 1}`,
            `Student transcript: ${transcript}`,
            `Previous attempts: ${JSON.stringify(body.previousAttempts ?? [])}`,
            `Local learning memory: ${JSON.stringify(body.learningMemory ?? {})}`,
            "Return structured JSON with grammar, vocabulary, natural_expression, fluency_score, suggested_response, follow_up_question, coaching_plan, micro_practice, and focus_training.",
            "Keep every item short and easy to read. Make the suggested_response sound natural for UK university life.",
            "If there are previous attempts, mention improvements through the score and corrections.",
            "Prioritise recurring issues from Local learning memory when choosing corrections and drills.",
            "If Local learning memory shows overused words such as very, good, or important, suggest more precise B1-B2 alternatives.",
            "Detect the student's main weakness as one of: grammar issue, vocabulary limitation, sentence structure.",
            "Make focus_training.next_question adapt to that weakness and any recurring weak area in Local learning memory.",
            "The follow_up_question must be exactly: Can you try again using my suggestions?"
          ].join("\n")
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "english_tutor_response",
          strict: true,
          schema: tutorResponseSchema
        }
      }
    })
  });

  if (!response.ok) {
    const details = await response.text();

    return NextResponse.json(
      {
        error: "Tutor request failed.",
        details
      },
      { status: response.status }
    );
  }

  const data = (await response.json()) as ResponsesApiResult;
  const outputText = extractOutputText(data);

  if (!outputText) {
    return NextResponse.json(
      {
        error: "Tutor response was empty."
      },
      { status: 502 }
    );
  }

  try {
    const tutorReply = JSON.parse(outputText) as TutorReply;

    return NextResponse.json(tutorReply);
  } catch {
    return NextResponse.json(
      {
        error: "Tutor response could not be read."
      },
      { status: 502 }
    );
  }
}

function createMockTutorReply(scenarioTitle: string): TutorReply {
  return {
    grammar: [
      "Use a full sentence when you give your opinion.",
      "Check verb tense when you talk about past actions."
    ],
    vocabulary: [
      {
        word: "confidence",
        meaning: "the feeling that you can do something well",
        example: "Speaking in small groups gives me more confidence."
      },
      {
        word: "clarify",
        meaning: "to make something easier to understand",
        example: "Could you clarify the question, please?"
      },
      {
        word: "relevant",
        meaning: "connected to the topic",
        example: "This example is relevant to university life."
      }
    ],
    natural_expression: [
      "In my opinion, this is helpful because students can share ideas and support each other."
    ],
    fluency_score: 8,
    suggested_response: `For this ${scenarioTitle.toLowerCase()} situation, I would say: I think this is useful because it helps students practise their ideas. For example, I feel more confident after speaking with classmates first.`,
    follow_up_question: "Can you try again using my suggestions?",
    coaching_plan: {
      what_to_fix: [
        "Make your reason more specific.",
        "Use one example from university life."
      ],
      what_to_practice_next: "Practise giving an opinion, one reason, and one short example.",
      targeted_drills: [
        "Say: In my opinion... because...",
        "Add: For example, in my seminar...",
        "Finish with: This helps me because..."
      ]
    },
    micro_practice: {
      sentence: "In my opinion, this is useful because it helps students share ideas.",
      instruction: "Repeat this sentence once, then change the reason to your own idea."
    },
    focus_training: {
      weakness: "sentence structure",
      next_question: "Can you answer again using: opinion + because + example?"
    }
  };
}

function extractOutputText(data: ResponsesApiResult) {
  if (data.output_text) {
    return data.output_text;
  }

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("")
    .trim();
}
