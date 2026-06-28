"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Trash2 } from "lucide-react";
import { useNotebook } from "@/components/useNotebook";

export default function NotebookPage() {
  const { entries, removeEntry, clearEntries } = useNotebook();

  return (
    <main className="min-h-screen bg-[#f8fbfa]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 sm:px-8 lg:py-10">
        <nav className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-sea">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          {entries.length > 0 ? (
            <button
              type="button"
              onClick={clearEntries}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-ink/10 hover:text-coral"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </nav>

        <header className="border-b border-ink/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-mist text-sea">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ink">Vocabulary notebook</h1>
              <p className="mt-1 text-sm text-ink/65">Words saved from your tutor feedback stay in this browser.</p>
            </div>
          </div>
        </header>

        {entries.length === 0 ? (
          <section className="border border-dashed border-ink/20 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-ink">No words saved yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/65">
              Try a speaking scenario, then save useful vocabulary from the feedback panel.
            </p>
            <Link
              href="/practice?scenario=seminar"
              className="mt-5 inline-flex rounded-md bg-sea px-4 py-3 text-sm font-semibold text-white hover:bg-ink"
            >
              Start practice
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {entries.map((entry) => (
              <article key={entry.id} className="border border-ink/10 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-ink">{entry.word}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{entry.meaning}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    aria-label={`Remove ${entry.word}`}
                    className="rounded-md p-2 text-ink/45 hover:bg-coral/10 hover:text-coral"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-4 border-l-4 border-lemon bg-lemon/15 p-3 text-sm leading-6 text-ink">
                  {entry.example}
                </p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
