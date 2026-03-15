export type Phase = "lobby" | "question" | "reveal" | "game-over";

export type ServerPlayer = {
  id: string;
  socketId: string;
  name: string;
  score: number;
  connected: boolean;
  currentAnswer: number | null;
  answerTime: number | null;
};

export type PreparedQuestion = {
  phrase: string;
  options: string[];
  correctIndex: number;
};

export type Room = {
  code: string;
  hostId: string;
  players: Map<string, ServerPlayer>;
  phase: Phase;
  round: number;
  totalRounds: number;
  language: string;
  topic: string;
  questions: PreparedQuestion[];
  currentQuestionStart: number;
  timeLimit: number;
  timer: ReturnType<typeof setInterval> | null;
  timeLeft: number;
  lastReveal: { correctIndex: number; playerResults: import("../src/lib/types.js").PlayerResult[] } | null;
  lastGameOver: { rankings: import("../src/lib/types.js").GameOverPayload["rankings"] } | null;
};
