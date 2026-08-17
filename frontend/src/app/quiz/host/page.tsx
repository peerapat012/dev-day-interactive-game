import type { Metadata } from "next";
import { QuizHostScreen } from "@/features/quiz/components/QuizHostScreen";

export const metadata: Metadata = {
  title: "Quiz Host — Word Cloud Game",
  description: "Host a live quiz with questions, timers, and a leaderboard",
};

export default function QuizHostPage() {
  return <QuizHostScreen />;
}