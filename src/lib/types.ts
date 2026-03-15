export type Phase = "lobby" | "question" | "reveal" | "game-over";

export type Question = {
  phrase: string;
  correct: string;
  wrong: string[];
};

export type Topic = {
  id: string;
  name: string;
  questions: Question[];
};

export type Language = {
  id: string;
  name: string;
  flag: string;
  topics: Topic[];
};

export type Player = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
};

export type PlayerResult = {
  playerId: string;
  playerName: string;
  answerIndex: number | null;
  correct: boolean;
  pointsEarned: number;
  totalScore: number;
};

export type RoomState = {
  code: string;
  hostId: string;
  players: Player[];
  phase: Phase;
  round: number;
  totalRounds: number;
  language?: string;
  topic?: string;
  timeLeft?: number;
};

export type QuestionPayload = {
  round: number;
  totalRounds: number;
  phrase: string;
  options: string[];
  timeLimit: number;
  language: string;
};

export type RevealPayload = {
  correctIndex: number;
  playerResults: PlayerResult[];
};

export type GameOverPayload = {
  rankings: {
    playerId: string;
    playerName: string;
    score: number;
    rank: number;
  }[];
};

// Client → Server events
export interface ClientEvents {
  "join-room": (data: { code: string; playerName: string; playerId: string }) => void;
  "start-game": (data: { language: string; topic: string }) => void;
  answer: (data: { answerIndex: number }) => void;
  "play-again": () => void;
  "leave-room": () => void;
}

// Server → Client events
export interface ServerEvents {
  "room-state": (data: RoomState) => void;
  question: (data: QuestionPayload) => void;
  tick: (data: { timeLeft: number }) => void;
  reveal: (data: RevealPayload) => void;
  "game-over": (data: GameOverPayload) => void;
  error: (data: { message: string }) => void;
}
