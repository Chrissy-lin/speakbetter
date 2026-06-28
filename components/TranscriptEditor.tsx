"use client";

type TranscriptEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
};

export function TranscriptEditor({ value, onChange, onSubmit, isSubmitting, canSubmit }: TranscriptEditorProps) {
  return (
    <section className="border border-ink/10 bg-white p-5 shadow-sm">
      <label htmlFor="transcript" className="text-lg font-bold text-ink">
        Transcript
      </label>
      <textarea
        id="transcript"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder="Your transcript will appear here. You can also type an answer."
        className="mt-3 w-full resize-y rounded-md border border-ink/15 bg-[#fbfdfc] p-4 text-base leading-7 text-ink outline-none transition focus:border-sea focus:ring-4 focus:ring-sea/10"
      />
      <p className="mt-3 text-sm font-medium text-ink/60">
        {isSubmitting ? "Your transcript has been sent to the coach." : "After recording, the transcript is sent to the coach automatically."}
      </p>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/35"
        >
          Submit typed attempt
        </button>
      </div>
    </section>
  );
}
