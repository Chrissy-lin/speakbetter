"use client";

import { BookPlus, CheckCircle2, Sparkles, Star } from "lucide-react";
import type { TutorReply } from "@/lib/types";
import { useNotebook } from "./useNotebook";

type FeedbackPanelProps = {
  feedback: TutorReply | null;
};

export function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const { addEntry, hasEntry } = useNotebook();

  if (!feedback) {
    return (
      <section className="border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Feedback</h2>
        <p className="mt-4 text-sm leading-6 text-ink/65">Grammar, vocabulary, natural expression, and a fluency score will appear here.</p>
      </section>
    );
  }

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Feedback</h2>
        <div className="flex items-center gap-1 rounded-md bg-lemon/25 px-3 py-2 text-sm font-bold text-ink">
          <Star className="h-4 w-4 fill-lemon text-lemon" />
          {feedback.fluency_score}/10
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <CheckCircle2 className="h-4 w-4 text-sea" />
            Grammar
          </h3>
          <ul className="mt-3 space-y-2">
            {feedback.grammar.map((item) => (
              <li key={item} className="rounded-md bg-mist/70 px-3 py-2 text-sm leading-6 text-ink/75">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Sparkles className="h-4 w-4 text-coral" />
            Natural Expression
          </h3>
          <ul className="mt-3 space-y-2">
            {feedback.natural_expression.map((item) => (
              <li key={item} className="rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm leading-6 text-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-ink">Vocabulary</h3>
          <div className="mt-3 space-y-3">
            {feedback.vocabulary.map((item) => {
              const saved = hasEntry(item.word);

              return (
                <article key={item.word} className="rounded-md border border-ink/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{item.word}</p>
                      <p className="mt-1 text-sm leading-6 text-ink/65">{item.meaning}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addEntry(item)}
                      disabled={saved}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sea px-3 py-2 text-xs font-semibold text-white hover:bg-ink disabled:cursor-default disabled:bg-ink/25"
                    >
                      <BookPlus className="h-3.5 w-3.5" />
                      {saved ? "Saved" : "Save"}
                    </button>
                  </div>
                  <p className="mt-3 bg-[#fbfdfc] p-3 text-sm leading-6 text-ink">{item.example}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
