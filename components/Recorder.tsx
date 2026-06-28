"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, PlayCircle, RotateCcw, Square } from "lucide-react";

type RecorderProps = {
  scenarioId: string;
  onTranscript: (transcript: string) => void;
};

export function Recorder({ scenarioId, onTranscript }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      stopStream();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        const nextAudioUrl = URL.createObjectURL(audioBlob);

        setAudioUrl((currentAudioUrl) => {
          if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl);
          }

          return nextAudioUrl;
        });

        stopStream();
        void transcribeAudio(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      stopStream();
      setError("Please allow microphone access to record your answer.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }

    setIsRecording(false);
  }

  function clearRecording() {
    setAudioUrl((currentAudioUrl) => {
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }

      return "";
    });
    setError("");
  }

  async function transcribeAudio(audioBlob: Blob) {
    setIsTranscribing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `practice-${scenarioId}.webm`);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as {
        transcript?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Transcription failed.");
      }

      onTranscript(data.transcript ?? "");
    } catch (transcriptionError) {
      const message =
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Your recording could not be transcribed.";

      setError(message);
    } finally {
      setIsTranscribing(false);
    }
  }

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Record your answer</h2>
          <p className="mt-1 text-sm leading-6 text-ink/65">Use your microphone to record. Your audio is transcribed with OpenAI after you stop.</p>
        </div>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-sea px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/35"
        >
          {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isTranscribing ? "Transcribing" : isRecording ? "Stop recording" : "Record"}
        </button>
      </div>
      {isRecording ? (
        <div className="mt-4 flex items-center gap-3 rounded-md bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-coral" />
          Recording now
        </div>
      ) : null}
      {isTranscribing ? (
        <div className="mt-4 flex items-center gap-3 rounded-md bg-mist px-4 py-3 text-sm font-semibold text-sea">
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcribing your recording
        </div>
      ) : null}
      {audioUrl ? (
        <div className="mt-4 rounded-md border border-ink/10 bg-[#fbfdfc] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <PlayCircle className="h-4 w-4 text-sea" />
              Latest recording
            </div>
            <button
              type="button"
              onClick={clearRecording}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ink/60 hover:bg-ink/5 hover:text-coral"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      ) : null}
      {error ? <p className="mt-4 rounded-md bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{error}</p> : null}
    </section>
  );
}
