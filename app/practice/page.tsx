"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpenCheck, CheckCircle2, Dumbbell, RotateCcw, Target, TrendingUp } from "lucide-react";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { Recorder } from "@/components/Recorder";
import { TranscriptEditor } from "@/components/TranscriptEditor";
import { TutorReplyCard } from "@/components/TutorReplyCard";
import { getScenario } from "@/lib/scenarios";
import type { LearningMemory, PracticeAttempt, TutorReply } from "@/lib/types";

const ATTEMPTS_STORAGE_KEY = "speakbetter:practice-attempts";
const LEARNING_MEMORY_STORAGE_KEY = "speakbetter:learning-memory";
const WATCHED_OVERUSED_WORDS = ["very", "good", "important"];

export default function PracticePage({
  searchParams
}: {
  searchParams: { scenario?: string };
}) {
  const scenario = useMemo(() => getScenario(searchParams.scenario ?? null), [searchParams.scenario]);
  const [transcript, setTranscript] = useState("");
  const [tutorReply, setTutorReply] = useState<TutorReply | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [attemptsLoaded, setAttemptsLoaded] = useState(false);
  const [learningMemory, setLearningMemory] = useState<LearningMemory>(createEmptyLearningMemory());
  const [learningMemoryLoaded, setLearningMemoryLoaded] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const rawAttempts = window.localStorage.getItem(ATTEMPTS_STORAGE_KEY);

    if (!rawAttempts) {
      setAttemptsLoaded(true);
      return;
    }

    try {
      setAttempts(JSON.parse(rawAttempts) as PracticeAttempt[]);
    } catch {
      setAttempts([]);
    } finally {
      setAttemptsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!attemptsLoaded) {
      return;
    }

    window.localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  }, [attempts, attemptsLoaded]);

  useEffect(() => {
    const rawMemory = window.localStorage.getItem(LEARNING_MEMORY_STORAGE_KEY);

    if (!rawMemory) {
      setLearningMemoryLoaded(true);
      return;
    }

    try {
      setLearningMemory(normalizeLearningMemory(JSON.parse(rawMemory) as Partial<LearningMemory>));
    } catch {
      setLearningMemory(createEmptyLearningMemory());
    } finally {
      setLearningMemoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!learningMemoryLoaded) {
      return;
    }

    window.localStorage.setItem(LEARNING_MEMORY_STORAGE_KEY, JSON.stringify(learningMemory));
  }, [learningMemory, learningMemoryLoaded]);

  async function sendToTutor(nextTranscript = transcript) {
    const trimmed = nextTranscript.trim();
    if (!trimmed) {
      setError("Please record or type your answer first.");
      return;
    }

    setIsThinking(true);
    setError("");

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          transcript: trimmed,
          attemptNumber: attempts.length + 1,
          previousAttempts: attempts.map((attempt) => ({
            transcript: attempt.transcript,
            fluency_score: attempt.feedback.fluency_score
          })),
          learningMemory: createTutorMemoryContext(learningMemory)
        })
      });

      const data = (await response.json()) as TutorReply | { error?: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Tutor request failed.");
      }

      if (!isTutorReply(data)) {
        throw new Error("Tutor response could not be read.");
      }

      const nextAttempt: PracticeAttempt = {
        id: crypto.randomUUID(),
        attemptNumber: attempts.length + 1,
        transcript: trimmed,
        feedback: data,
        createdAt: new Date().toISOString()
      };

      setTutorReply(data);
      setAttempts((currentAttempts) => [nextAttempt, ...currentAttempts]);
      setLearningMemory((currentMemory) => updateLearningMemory(currentMemory, trimmed, data));
    } catch (tutorError) {
      const message =
        tutorError instanceof Error
          ? tutorError.message
          : "The tutor is not available right now. Please try again.";

      setError(message);
    } finally {
      setIsThinking(false);
    }
  }

  function startRetry() {
    setTranscript("");
    setTutorReply(null);
    setError("");
  }

  const bestScore = attempts.reduce((score, attempt) => Math.max(score, attempt.feedback.fluency_score), 0);

  return (
    <main className="min-h-screen bg-[#f8fbfa]">
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)] lg:py-8">
        <section className="flex flex-col gap-5">
          <nav className="flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-sea">
              <ArrowLeft className="h-4 w-4" />
              Scenarios
            </Link>
            <Link href="/notebook" className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-ink/10 hover:text-sea">
              <BookOpenCheck className="h-4 w-4" />
              Notebook
            </Link>
          </nav>

          <div className="border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sea">{scenario.title}</p>
            <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Practice your answer</h1>
            <p className="mt-4 rounded-md bg-mist p-4 text-base font-medium leading-7 text-ink">{scenario.prompt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {scenario.goals.map((goal) => (
                <span key={goal} className="rounded-md border border-sea/20 bg-white px-3 py-2 text-xs font-semibold text-sea">
                  {goal}
                </span>
              ))}
            </div>
          </div>

          <Recorder
            scenarioId={scenario.id}
            onTranscript={(nextTranscript) => {
              setTranscript(nextTranscript);
              void sendToTutor(nextTranscript);
            }}
          />

          <TranscriptEditor
            value={transcript}
            onChange={setTranscript}
            onSubmit={() => void sendToTutor()}
            isSubmitting={isThinking}
            canSubmit={transcript.trim().length > 0}
          />

          {error ? (
            <p className="rounded-md border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{error}</p>
          ) : null}
        </section>

        <aside className="flex flex-col gap-5">
          <section className="border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">Learning loop</h2>
              <div className="flex items-center gap-1 rounded-md bg-mist px-3 py-2 text-sm font-bold text-sea">
                <TrendingUp className="h-4 w-4" />
                Best {bestScore || "-"} / 10
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-ink/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Attempts</p>
                <p className="mt-1 text-2xl font-bold text-ink">{attempts.length}</p>
              </div>
              <div className="rounded-md border border-ink/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Latest</p>
                <p className="mt-1 text-2xl font-bold text-ink">{tutorReply ? `${tutorReply.fluency_score}/10` : "-"}</p>
              </div>
            </div>
            {tutorReply ? (
              <button
                type="button"
                onClick={startRetry}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-sea"
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </button>
            ) : null}
          </section>

          <TutorReplyCard
            reply={tutorReply?.suggested_response ?? ""}
            followUpQuestion={tutorReply?.follow_up_question ?? ""}
            isLoading={isThinking}
          />
          <CoachingComparison attempts={attempts} />
          <CoachingPlanCard feedback={tutorReply} />
          <MicroPracticeCard feedback={tutorReply} />
          <FocusTrainingCard feedback={tutorReply} />
          <WeakPointsPanel learningMemory={learningMemory} />
          <ProgressStory attempts={attempts} />
          <FeedbackPanel feedback={tutorReply} />
          <AttemptHistory attempts={attempts} />
        </aside>
      </div>
    </main>
  );
}

function WeakPointsPanel({ learningMemory }: { learningMemory: LearningMemory }) {
  const topIssues = getTopIssues(learningMemory, 3);
  const improvement = getWeakPointImprovement(learningMemory);

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Your Weak Points</h2>
      {topIssues.length > 0 ? (
        <div className="mt-4 space-y-3">
          {topIssues.map((issue) => (
            <div key={`${issue.category}-${issue.label}`} className="rounded-md border border-ink/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{issue.label}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">{issue.category}</p>
                </div>
                <span className="rounded-md bg-lemon/25 px-2 py-1 text-xs font-bold text-ink">
                  {issue.count}x
                </span>
              </div>
            </div>
          ))}
          <p className="rounded-md bg-mist px-4 py-3 text-sm font-semibold leading-6 text-sea">
            {improvement}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink/65">Recurring grammar, vocabulary, and sentence-structure issues will appear here after a few attempts.</p>
      )}
    </section>
  );
}

function isTutorReply(value: TutorReply | { error?: string }): value is TutorReply {
  return (
    "grammar" in value &&
    "vocabulary" in value &&
    "natural_expression" in value &&
    "fluency_score" in value &&
    "suggested_response" in value &&
    "follow_up_question" in value &&
    "coaching_plan" in value &&
    "micro_practice" in value &&
    "focus_training" in value &&
    Array.isArray(value.grammar) &&
    Array.isArray(value.vocabulary) &&
    Array.isArray(value.natural_expression) &&
    typeof value.fluency_score === "number" &&
    typeof value.suggested_response === "string" &&
    typeof value.follow_up_question === "string" &&
    typeof value.coaching_plan === "object" &&
    value.coaching_plan !== null &&
    typeof value.micro_practice === "object" &&
    value.micro_practice !== null &&
    typeof value.focus_training === "object" &&
    value.focus_training !== null
  );
}

function CoachingPlanCard({ feedback }: { feedback: TutorReply | null }) {
  if (!feedback) {
    return (
      <section className="border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Dumbbell className="h-5 w-5 text-sea" />
          Coaching plan
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink/65">Your fix list, next focus, and drills will appear after feedback.</p>
      </section>
    );
  }

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Dumbbell className="h-5 w-5 text-sea" />
        Coaching plan
      </h2>
      <div className="mt-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-ink">What to fix</h3>
          <ul className="mt-2 space-y-2">
            {feedback.coaching_plan.what_to_fix.map((item) => (
              <li key={item} className="rounded-md bg-mist/70 px-3 py-2 text-sm leading-6 text-ink/75">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">What to practise next</h3>
          <p className="mt-2 rounded-md border border-sea/20 bg-[#fbfdfc] px-3 py-2 text-sm leading-6 text-ink">
            {feedback.coaching_plan.what_to_practice_next}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">Targeted drills</h3>
          <ul className="mt-2 space-y-2">
            {feedback.coaching_plan.targeted_drills.map((drill) => (
              <li key={drill} className="rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm leading-6 text-ink">
                {drill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function MicroPracticeCard({ feedback }: { feedback: TutorReply | null }) {
  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Target className="h-5 w-5 text-coral" />
        Micro practice
      </h2>
      {feedback ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-md bg-lemon/20 px-4 py-3 text-base font-bold leading-7 text-ink">
            {feedback.micro_practice.sentence}
          </p>
          <p className="text-sm leading-6 text-ink/70">{feedback.micro_practice.instruction}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink/65">The coach will give you one short sentence to repeat or improve.</p>
      )}
    </section>
  );
}

function FocusTrainingCard({ feedback }: { feedback: TutorReply | null }) {
  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Focus training</h2>
      {feedback ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-md bg-mist px-3 py-2 text-sm font-bold capitalize text-sea">
            {feedback.focus_training.weakness}
          </div>
          <p className="rounded-md border border-ink/10 bg-[#fbfdfc] px-3 py-2 text-sm font-semibold leading-6 text-ink">
            {feedback.focus_training.next_question}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink/65">The coach will detect whether your main focus is grammar, vocabulary, or sentence structure.</p>
      )}
    </section>
  );
}

function CoachingComparison({ attempts }: { attempts: PracticeAttempt[] }) {
  const originalAttempt = attempts.at(-1);
  const retryAttempt = attempts.length > 1 ? attempts[0] : null;
  const comparison = originalAttempt && retryAttempt ? getImprovementSummary(originalAttempt, retryAttempt) : null;

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Coaching loop</h2>
        {comparison ? (
          <span className="rounded-md bg-sea px-3 py-2 text-sm font-bold text-white">
            +{comparison.clarityPercent}%
          </span>
        ) : null}
      </div>

      {originalAttempt ? (
        <div className="mt-4 space-y-4">
          <ComparisonBlock title="Your Answer" text={originalAttempt.transcript} />
          <ComparisonBlock title="Suggested Answer" text={originalAttempt.feedback.suggested_response} tone="suggested" />
          <ComparisonBlock
            title="Your Improvement Attempt"
            text={retryAttempt?.transcript ?? "Record or type again to compare your improved answer."}
            tone={retryAttempt ? "improved" : "empty"}
          />

          {comparison ? (
            <div className="rounded-md border border-sea/20 bg-mist p-4">
              <p className="text-sm font-bold text-sea">
                You improved your expression clarity by +{comparison.clarityPercent}%
              </p>
              <div className="mt-3 grid gap-2 text-sm text-ink/75">
                <ProgressLine label="Grammar improved" active={comparison.grammarImproved} />
                <ProgressLine label="Vocabulary improved" active={comparison.vocabularyImproved} />
                <ProgressLine label="Fluency score increased" active={comparison.scoreIncreased} />
              </div>
            </div>
          ) : (
            <p className="rounded-md bg-mist px-4 py-3 text-sm font-semibold text-sea">
              Use the suggested answer, then try again to unlock improvement tracking.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Your original answer, model answer, and retry comparison will appear here.
        </p>
      )}
    </section>
  );
}

function ProgressStory({ attempts }: { attempts: PracticeAttempt[] }) {
  const todayAttempts = attempts.filter((attempt) => isSameDay(attempt.createdAt, 0));
  const yesterdayAttempts = attempts.filter((attempt) => isSameDay(attempt.createdAt, -1));
  const todayAverage = averageScore(todayAttempts);
  const yesterdayAverage = averageScore(yesterdayAttempts);
  const trend = attempts
    .slice()
    .reverse()
    .map((attempt) => attempt.feedback.fluency_score);
  const trendLabel = trend.length > 1 && trend[trend.length - 1] > trend[0] ? "rising" : trend.length > 1 ? "steady" : "new";

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Progress story</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-ink/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Today</p>
          <p className="mt-1 text-2xl font-bold text-ink">{todayAverage ? `${todayAverage}/10` : "-"}</p>
        </div>
        <div className="rounded-md border border-ink/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Yesterday</p>
          <p className="mt-1 text-2xl font-bold text-ink">{yesterdayAverage ? `${yesterdayAverage}/10` : "-"}</p>
        </div>
      </div>
      <p className="mt-4 rounded-md bg-mist px-4 py-3 text-sm font-semibold leading-6 text-sea">
        {getProgressStoryText(todayAverage, yesterdayAverage, trendLabel)}
      </p>
      {trend.length > 0 ? (
        <div className="mt-4 flex h-16 items-end gap-2">
          {trend.map((score, index) => (
            <div
              key={`${score}-${index}`}
              className="w-full rounded-t-sm bg-sea"
              style={{ height: `${Math.max(12, score * 10)}%` }}
              title={`Attempt ${index + 1}: ${score}/10`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ComparisonBlock({
  title,
  text,
  tone = "default"
}: {
  title: string;
  text: string;
  tone?: "default" | "suggested" | "improved" | "empty";
}) {
  const toneClass =
    tone === "suggested"
      ? "border-coral/20 bg-coral/10"
      : tone === "improved"
        ? "border-sea/20 bg-mist"
        : tone === "empty"
          ? "border-dashed border-ink/20 bg-[#fbfdfc] text-ink/55"
          : "border-ink/10 bg-[#fbfdfc]";

  return (
    <article className={`rounded-md border p-3 ${toneClass}`}>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/75">{text}</p>
    </article>
  );
}

function ProgressLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className={`h-4 w-4 ${active ? "text-sea" : "text-ink/25"}`} />
      <span className={active ? "font-semibold text-ink" : "text-ink/55"}>{label}</span>
    </div>
  );
}

function getImprovementSummary(originalAttempt: PracticeAttempt, retryAttempt: PracticeAttempt) {
  const scoreGain = retryAttempt.feedback.fluency_score - originalAttempt.feedback.fluency_score;
  const originalGrammarCount = originalAttempt.feedback.grammar.length;
  const retryGrammarCount = retryAttempt.feedback.grammar.length;
  const grammarImproved = retryGrammarCount <= originalGrammarCount || scoreGain > 0;
  const vocabularyImproved = hasVocabularyCarryover(originalAttempt, retryAttempt);
  const scoreIncreased = scoreGain > 0;
  const clarityPercent = Math.max(
    0,
    Math.min(35, scoreGain * 10 + (grammarImproved ? 3 : 0) + (vocabularyImproved ? 2 : 0))
  );

  return {
    grammarImproved,
    vocabularyImproved,
    scoreIncreased,
    clarityPercent
  };
}

function averageScore(attempts: PracticeAttempt[]) {
  if (attempts.length === 0) {
    return 0;
  }

  const total = attempts.reduce((sum, attempt) => sum + attempt.feedback.fluency_score, 0);
  return Math.round((total / attempts.length) * 10) / 10;
}

function isSameDay(dateValue: string, dayOffset: number) {
  const date = new Date(dateValue);
  const target = new Date();
  target.setDate(target.getDate() + dayOffset);

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function getProgressStoryText(todayAverage: number, yesterdayAverage: number, trendLabel: string) {
  if (todayAverage && yesterdayAverage) {
    const difference = Math.round((todayAverage - yesterdayAverage) * 10) / 10;
    const sign = difference > 0 ? "+" : "";
    return `Today is ${sign}${difference} points compared with yesterday. Your fluency trend is ${trendLabel}.`;
  }

  if (todayAverage) {
    return `Today your average fluency is ${todayAverage}/10. Keep practising to build a yesterday comparison.`;
  }

  return "Complete your first attempt to start your fluency trend.";
}

function hasVocabularyCarryover(originalAttempt: PracticeAttempt, retryAttempt: PracticeAttempt) {
  const retryTranscript = retryAttempt.transcript.toLowerCase();

  return originalAttempt.feedback.vocabulary.some((item) => retryTranscript.includes(item.word.toLowerCase()));
}

function createEmptyLearningMemory(): LearningMemory {
  return {
    grammarErrors: {},
    overusedWords: {},
    weakStructures: {},
    weakAreas: {},
    sessions: [],
    lastUpdated: ""
  };
}

function normalizeLearningMemory(memory: Partial<LearningMemory>): LearningMemory {
  return {
    grammarErrors: memory.grammarErrors ?? {},
    overusedWords: memory.overusedWords ?? {},
    weakStructures: memory.weakStructures ?? {},
    weakAreas: memory.weakAreas ?? {},
    sessions: memory.sessions ?? [],
    lastUpdated: memory.lastUpdated ?? ""
  };
}

function updateLearningMemory(memory: LearningMemory, transcript: string, feedback: TutorReply): LearningMemory {
  const grammarErrors = { ...memory.grammarErrors };
  const overusedWords = { ...memory.overusedWords };
  const weakStructures = { ...memory.weakStructures };
  const weakAreas = { ...memory.weakAreas };
  let issueCount = 0;

  feedback.grammar.forEach((item) => {
    addIssue(grammarErrors, normaliseIssueLabel(item));
    issueCount += 1;
  });

  WATCHED_OVERUSED_WORDS.forEach((word) => {
    const count = countWord(transcript, word);

    if (count > 0) {
      overusedWords[word] = (overusedWords[word] ?? 0) + count;
      issueCount += count;
    }
  });

  addIssue(weakAreas, feedback.focus_training.weakness);
  issueCount += 1;

  if (feedback.focus_training.weakness === "sentence structure") {
    feedback.coaching_plan.what_to_fix.forEach((item) => {
      addIssue(weakStructures, normaliseIssueLabel(item));
      issueCount += 1;
    });
  }

  return {
    grammarErrors,
    overusedWords,
    weakStructures,
    weakAreas,
    sessions: [
      {
        date: new Date().toISOString(),
        issueCount,
        fluencyScore: feedback.fluency_score
      },
      ...memory.sessions
    ].slice(0, 40),
    lastUpdated: new Date().toISOString()
  };
}

function createTutorMemoryContext(memory: LearningMemory) {
  return {
    topIssues: getTopIssues(memory, 5).map((issue) => `${issue.category}: ${issue.label}`),
    weakAreas: Object.entries(memory.weakAreas)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3)
      .map(([area]) => area),
    overusedWords: Object.entries(memory.overusedWords)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3)
      .map(([word]) => word)
  };
}

function getTopIssues(memory: LearningMemory, limit: number) {
  const issues = [
    ...mapIssueEntries(memory.grammarErrors, "Grammar"),
    ...mapIssueEntries(memory.overusedWords, "Overused word"),
    ...mapIssueEntries(memory.weakStructures, "Sentence structure"),
    ...mapIssueEntries(memory.weakAreas, "Weak area")
  ];

  return issues.sort((first, second) => second.count - first.count).slice(0, limit);
}

function mapIssueEntries(source: Record<string, number>, category: string) {
  return Object.entries(source).map(([label, count]) => ({
    label,
    count,
    category
  }));
}

function getWeakPointImprovement(memory: LearningMemory) {
  const latest = memory.sessions[0];
  const previous = memory.sessions[1];

  if (!latest) {
    return "Your weak-point story will build as you practise.";
  }

  if (!previous) {
    return `First memory snapshot saved: ${latest.issueCount} issue signals found.`;
  }

  const issueDifference = previous.issueCount - latest.issueCount;
  const scoreDifference = latest.fluencyScore - previous.fluencyScore;

  if (issueDifference > 0 || scoreDifference > 0) {
    return `Improving: ${Math.max(issueDifference, 0)} fewer issue signals and ${formatSignedNumber(scoreDifference)} fluency points since the last attempt.`;
  }

  return "Still practising: the coach will keep prioritising these recurring weak points.";
}

function addIssue(target: Record<string, number>, label: string) {
  if (!label) {
    return;
  }

  target[label] = (target[label] ?? 0) + 1;
}

function normaliseIssueLabel(label: string) {
  return label.trim().replace(/\s+/g, " ").slice(0, 90);
}

function countWord(transcript: string, word: string) {
  const matches = transcript.toLowerCase().match(new RegExp(`\\b${word}\\b`, "g"));
  return matches?.length ?? 0;
}

function formatSignedNumber(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function AttemptHistory({ attempts }: { attempts: PracticeAttempt[] }) {
  if (attempts.length === 0) {
    return (
      <section className="border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Previous attempts</h2>
        <p className="mt-3 text-sm leading-6 text-ink/65">Your recordings will appear here after the coach gives feedback.</p>
      </section>
    );
  }

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Previous attempts</h2>
      <div className="mt-4 space-y-3">
        {attempts.map((attempt) => (
          <article key={attempt.id} className="rounded-md border border-ink/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink">Attempt {attempt.attemptNumber}</p>
              <span className="rounded-md bg-lemon/25 px-2 py-1 text-xs font-bold text-ink">
                {attempt.feedback.fluency_score}/10
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/65">{attempt.transcript}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
