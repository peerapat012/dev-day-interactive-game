import type { QuizWorkflow } from "@/lib/quizWorkflow";
import type { QuizGuest } from "@/types/quiz";

export const QUIZ_GUEST_NAMES_REFRESH_MS = 5000;

/** Start after workflow.open(), which resets the workflow's guest roster. */
export function syncQuizGuestNames(
  workflow: QuizWorkflow,
  loadGuests: () => Promise<QuizGuest[]>,
  onError: (error: unknown) => void,
): () => void {
  let stopped = false;
  let loading = false;
  let phase = workflow.getState().phase;

  async function refresh() {
    if (stopped || loading) return;
    loading = true;
    try {
      const guests = await loadGuests();
      if (!stopped) workflow.setGuests(guests);
    } catch (error) {
      // Preserve known names; the next phase change or poll retries the load.
      if (!stopped) onError(error);
    } finally {
      loading = false;
    }
  }

  const unsubscribe = workflow.subscribe((state) => {
    if (state.phase === phase) return;
    phase = state.phase;
    void refresh();
  });
  const timer = setInterval(() => void refresh(), QUIZ_GUEST_NAMES_REFRESH_MS);
  void refresh();

  return () => {
    stopped = true;
    clearInterval(timer);
    unsubscribe();
  };
}
