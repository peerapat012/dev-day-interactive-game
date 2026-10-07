interface RoundQuestionCardProps {
  question: string;
  className?: string;
}

/** Read-only display of the host's question for the current round. */
export function RoundQuestionCard({ question, className = "" }: RoundQuestionCardProps) {
  const text = question.trim();
  if (!text) return null;

  return (
    <div
      className={`rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300 sm:text-xs">
        Question
      </p>
      <p className="mt-1 break-words text-base font-semibold text-zinc-50 sm:text-lg">
        {text}
      </p>
    </div>
  );
}
