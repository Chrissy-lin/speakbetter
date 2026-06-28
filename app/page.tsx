import Link from "next/link";
import { ArrowRight, BookOpenCheck, MessageCircle, Mic2 } from "lucide-react";
import { scenarioIcons, scenarios } from "@/lib/scenarios";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f8fbfa]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:py-12">
        <header className="flex flex-col gap-5 rounded-none border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
              English speaking practice
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
              SpeakBetter
            </h1>
            <p className="mt-4 text-base leading-7 text-ink/70 sm:text-lg">
              Practise realistic university and work conversations. Record your answer, read a simple tutor reply, and save useful words for later.
            </p>
          </div>
          <Link
            href="/notebook"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea"
          >
            <BookOpenCheck className="h-4 w-4" />
            Notebook
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 border border-ink/10 bg-white p-4 shadow-sm">
            <Mic2 className="h-5 w-5 text-coral" />
            <span className="text-sm font-medium text-ink">Record speech</span>
          </div>
          <div className="flex items-center gap-3 border border-ink/10 bg-white p-4 shadow-sm">
            <MessageCircle className="h-5 w-5 text-sea" />
            <span className="text-sm font-medium text-ink">Get B1-level replies</span>
          </div>
          <div className="flex items-center gap-3 border border-ink/10 bg-white p-4 shadow-sm">
            <BookOpenCheck className="h-5 w-5 text-lemon" />
            <span className="text-sm font-medium text-ink">Save vocabulary</span>
          </div>
        </div>

        <section aria-labelledby="scenario-heading" className="py-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="scenario-heading" className="text-2xl font-bold text-ink">
              Choose a scenario
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {scenarios.map((scenario) => {
              const Icon = scenarioIcons[scenario.iconName];

              return (
                <Link
                  key={scenario.id}
                  href={`/practice?scenario=${scenario.id}`}
                  className="group border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sea/40 hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-mist text-sea">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-ink">{scenario.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-ink/68">{scenario.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-ink/35 transition group-hover:translate-x-1 group-hover:text-sea" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
