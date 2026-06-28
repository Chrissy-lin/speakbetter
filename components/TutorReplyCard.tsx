"use client";

import { Loader2, MessageCircle } from "lucide-react";

type TutorReplyCardProps = {
  reply: string;
  followUpQuestion: string;
  isLoading: boolean;
};

export function TutorReplyCard({ reply, followUpQuestion, isLoading }: TutorReplyCardProps) {
  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-mist text-sea">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
        </div>
        <h2 className="text-lg font-bold text-ink">Suggested Response</h2>
      </div>
      <p className="mt-4 min-h-24 rounded-md bg-[#fbfdfc] p-4 text-sm leading-6 text-ink/75">
        {isLoading ? "Reading your transcript..." : reply || "A suggested response will appear here after you send a transcript."}
      </p>
      {followUpQuestion ? (
        <p className="mt-3 rounded-md border border-sea/20 bg-mist px-4 py-3 text-sm font-bold leading-6 text-sea">
          {followUpQuestion}
        </p>
      ) : null}
    </section>
  );
}
