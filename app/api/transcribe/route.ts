import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "OPENAI_API_KEY is not configured."
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      {
        error: "Audio file is required."
      },
      { status: 400 }
    );
  }

  const openAiForm = new FormData();
  openAiForm.append("model", TRANSCRIPTION_MODEL);
  openAiForm.append("file", audio, audio.name || "practice.webm");
  openAiForm.append("language", "en");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: openAiForm
  });

  if (!response.ok) {
    const details = await response.text();

    return NextResponse.json(
      {
        error: "Transcription failed.",
        details
      },
      { status: response.status }
    );
  }

  const data = (await response.json()) as { text?: string };

  return NextResponse.json({
    transcript: data.text ?? ""
  });
}
