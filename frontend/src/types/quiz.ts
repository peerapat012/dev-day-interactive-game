export type QuizPhase =
  | "lobby"
  | "live"
  | "reveal"
  | "leaderboard"
  | "podium";

export type RoomMode = "wordcloud" | "quiz";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  timeLimitMs: number;
}

export interface QuestionDeck {
  id: string;
  name: string;
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  $id?: string;
  roomId: string;
  questionId: string;
  guestId: string;
  guestUuid: string;
  selectedOptionId: string;
  answeredAt: string;
  isCorrect: boolean;
  points: number;
}

export interface QuizGuest {
  guestUuid: string;
  displayName: string;
}

export interface QuizLeaderboardEntry {
  rank: number;
  guestUuid: string;
  displayName: string;
  score: number;
  correct: number;
}

/** Persisted as `gameStateJson` on the rooms table and broadcast over realtime. */
export interface QuizRoomGameState {
  phase: QuizPhase;
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion | null;
  questionStartedAtMs: number | null;
}