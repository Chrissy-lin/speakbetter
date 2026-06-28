import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe";
const OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";

type OpenAiTranscriptionResponse = {
  text?: string;
};

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim();
}

async function getErrorDetails(response: Response) {
  const details = await response.text();

  try {
    return JSON.stringify(JSON.parse(details));
  } catch {
    return details;
  }
}

export async function POST(request: Request) {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    console.error("[api/transcribe] OPENAI_API_KEY is not configured.");
    return NextResponse.json(
      {
        error: "OPENAI_API_KEY is not configured."
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json(
        {
          error: "Audio file is required."
        },
        { status: 400 }
      );
    }

    const filename = "name" in audio && typeof audio.name === "string" ? audio.name : "practice.webm";
    const audioFile = new Blob([await audio.arrayBuffer()], {
      type: audio.type || "audio/webm"
    });
    const openAiForm = new FormData();

    openAiForm.append("file", audioFile, filename);
    openAiForm.append("model", TRANSCRIPTION_MODEL);
    openAiForm.append("language", "en");
    openAiForm.append("response_format", "json");

    const response = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: openAiForm
    });

    if (!response.ok) {
      const details = await getErrorDetails(response);

      console.error("[api/transcribe] OpenAI transcription failed", {
        status: response.status,
        model: TRANSCRIPTION_MODEL,
        details
      });

      return NextResponse.json(
        {
          error: "Transcription failed.",
          details
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as OpenAiTranscriptionResponse;
    const transcript = data.text?.trim() ?? "";

    return NextResponse.json({
      transcript
    });
  } catch (error) {
    console.error("[api/transcribe] Unexpected transcription error", error);

    return NextResponse.json(
      {
        error: "Unexpected transcription error."
      },
      { status: 500 }
    );
  }
}
