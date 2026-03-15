import { Server, Socket } from "socket.io";
import { Room, ServerPlayer, PreparedQuestion } from "./types.js";
import { languages } from "../src/data/questions.js";
import type {
  RoomState,
  QuestionPayload,
  RevealPayload,
  GameOverPayload,
  PlayerResult,
  ClientEvents,
  ServerEvents,
} from "../src/lib/types.js";

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code: string;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prepareQuestions(languageId: string, topicId: string, count: number): PreparedQuestion[] {
  const lang = languages.find((l) => l.id === languageId);
  if (!lang) return [];
  const topic = lang.topics.find((t) => t.id === topicId);
  if (!topic) return [];

  const picked = shuffle(topic.questions).slice(0, count);
  return picked.map((q) => {
    const allOptions = shuffle([q.correct, ...q.wrong]);
    return {
      phrase: q.phrase,
      options: allOptions,
      correctIndex: allOptions.indexOf(q.correct),
    };
  });
}

function getRoomState(room: Room): RoomState {
  return {
    code: room.code,
    hostId: room.hostId,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: p.connected,
    })),
    phase: room.phase,
    round: room.round,
    totalRounds: room.totalRounds,
    language: room.language,
    topic: room.topic,
    timeLeft: room.timeLeft,
  };
}

function broadcastRoomState(io: Server, room: Room) {
  io.to(room.code).emit("room-state", getRoomState(room));
}

function startQuestion(io: Server, room: Room) {
  const q = room.questions[room.round - 1];
  room.phase = "question";
  room.currentQuestionStart = Date.now();
  room.timeLeft = room.timeLimit;

  // Reset answers
  for (const player of room.players.values()) {
    player.currentAnswer = null;
    player.answerTime = null;
  }

  const payload: QuestionPayload = {
    round: room.round,
    totalRounds: room.totalRounds,
    phrase: q.phrase,
    options: q.options,
    timeLimit: room.timeLimit,
    language: room.language,
  };

  broadcastRoomState(io, room);
  io.to(room.code).emit("question", payload);

  // Start countdown
  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit("tick", { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      clearInterval(room.timer!);
      room.timer = null;
      endQuestion(io, room);
    }
  }, 1000);
}

function allPlayersAnswered(room: Room): boolean {
  for (const player of room.players.values()) {
    if (player.connected && player.currentAnswer === null) return false;
  }
  return true;
}

function endQuestion(io: Server, room: Room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }

  const q = room.questions[room.round - 1];
  const playerResults: PlayerResult[] = [];

  for (const player of room.players.values()) {
    const correct = player.currentAnswer === q.correctIndex;
    let pointsEarned = 0;
    if (correct && player.answerTime !== null) {
      const elapsed = (player.answerTime - room.currentQuestionStart) / 1000;
      if (elapsed <= 2) {
        // Max points for fast answers (first 2 seconds)
        pointsEarned = 80;
      } else {
        // Linearly decrease from 80 to 50 over the remaining time
        const ratio = (elapsed - 2) / (room.timeLimit - 2);
        pointsEarned = Math.round(80 - 30 * Math.min(ratio, 1));
      }
    }
    player.score += pointsEarned;

    playerResults.push({
      playerId: player.id,
      playerName: player.name,
      answerIndex: player.currentAnswer,
      correct,
      pointsEarned,
      totalScore: player.score,
    });
  }

  room.phase = "reveal";
  const revealPayload: RevealPayload = { correctIndex: q.correctIndex, playerResults };
  room.lastReveal = revealPayload;
  broadcastRoomState(io, room);
  io.to(room.code).emit("reveal", revealPayload);

  // After 3s, next question or game over
  setTimeout(() => {
    if (room.round >= room.totalRounds) {
      endGame(io, room);
    } else {
      room.round++;
      startQuestion(io, room);
    }
  }, 3000);
}

function endGame(io: Server, room: Room) {
  room.phase = "game-over";
  const sorted = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
  const rankings: GameOverPayload["rankings"] = sorted.map((p, i) => ({
    playerId: p.id,
    playerName: p.name,
    score: p.score,
    rank: i + 1,
  }));

  room.lastGameOver = { rankings };
  broadcastRoomState(io, room);
  io.to(room.code).emit("game-over", { rankings });
}

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket<ClientEvents, ServerEvents>) => {
    let currentRoom: Room | null = null;
    let playerId: string | null = null;

    socket.on("join-room", ({ code, playerName, playerId: pid }) => {
      const upperCode = code.toUpperCase();
      let room = rooms.get(upperCode);

      if (!room) {
        // Create new room
        room = {
          code: upperCode.length === 4 ? upperCode : generateCode(),
          hostId: pid,
          players: new Map(),
          phase: "lobby",
          round: 0,
          totalRounds: 10,
          language: "",
          topic: "",
          questions: [],
          currentQuestionStart: 0,
          timeLimit: 15,
          timer: null,
          timeLeft: 0,
          lastReveal: null,
          lastGameOver: null,
        };
        if (upperCode.length !== 4) {
          room.code = generateCode();
        }
        rooms.set(room.code, room);
      }

      // Check if this player already exists in the room (reconnect / refresh)
      const existing = room.players.get(pid);
      if (existing) {
        existing.socketId = socket.id;
        existing.connected = true;
        existing.name = playerName;
        currentRoom = room;
        playerId = pid;
        socket.join(room.code);
        broadcastRoomState(io, room);

        // Resend phase-specific data so the client can resume
        if (room.phase === "question" && room.round > 0) {
          const q = room.questions[room.round - 1];
          socket.emit("question", {
            round: room.round,
            totalRounds: room.totalRounds,
            phrase: q.phrase,
            options: q.options,
            timeLimit: room.timeLimit,
            language: room.language,
          });
          socket.emit("tick", { timeLeft: room.timeLeft });
        } else if (room.phase === "reveal" && room.lastReveal) {
          socket.emit("reveal", room.lastReveal);
        } else if (room.phase === "game-over" && room.lastGameOver) {
          socket.emit("game-over", room.lastGameOver);
        }
        return;
      }

      // New player joining
      if (room.phase !== "lobby") {
        socket.emit("error", { message: "Игра уже идёт" });
        return;
      }

      if (room.players.size >= 8) {
        socket.emit("error", { message: "Комната заполнена (макс. 8 игроков)" });
        return;
      }

      const player: ServerPlayer = {
        id: pid,
        socketId: socket.id,
        name: playerName,
        score: 0,
        connected: true,
        currentAnswer: null,
        answerTime: null,
      };

      room.players.set(pid, player);
      currentRoom = room;
      playerId = pid;
      socket.join(room.code);
      broadcastRoomState(io, room);
    });

    socket.on("start-game", ({ language, topic }) => {
      if (!currentRoom || !playerId) return;
      if (currentRoom.hostId !== playerId) {
        socket.emit("error", { message: "Только хост может начать игру" });
        return;
      }
      if (currentRoom.players.size < 1) {
        socket.emit("error", { message: "Нужен хотя бы 1 игрок" });
        return;
      }

      currentRoom.language = language;
      currentRoom.topic = topic;
      currentRoom.questions = prepareQuestions(language, topic, currentRoom.totalRounds);

      if (currentRoom.questions.length === 0) {
        socket.emit("error", { message: "Вопросы не найдены для этого выбора" });
        return;
      }

      currentRoom.totalRounds = Math.min(10, currentRoom.questions.length);
      currentRoom.round = 1;

      // Reset scores
      for (const player of currentRoom.players.values()) {
        player.score = 0;
      }

      startQuestion(io, currentRoom);
    });

    socket.on("answer", ({ answerIndex }) => {
      if (!currentRoom || !playerId) return;
      if (currentRoom.phase !== "question") return;

      const player = currentRoom.players.get(playerId);
      if (!player || player.currentAnswer !== null) return;

      player.currentAnswer = answerIndex;
      player.answerTime = Date.now();

      // If all answered, end early
      if (allPlayersAnswered(currentRoom)) {
        endQuestion(io, currentRoom);
      }
    });

    socket.on("play-again", () => {
      if (!currentRoom || !playerId) return;
      if (currentRoom.hostId !== playerId) return;

      currentRoom.phase = "lobby";
      currentRoom.round = 0;
      currentRoom.questions = [];
      currentRoom.lastReveal = null;
      currentRoom.lastGameOver = null;
      for (const player of currentRoom.players.values()) {
        player.score = 0;
        player.currentAnswer = null;
        player.answerTime = null;
      }

      broadcastRoomState(io, currentRoom);
    });

    socket.on("leave-room", () => {
      if (!currentRoom || !playerId) return;
      socket.leave(currentRoom.code);
      currentRoom.players.delete(playerId);

      // If room is empty, clean up
      if (currentRoom.players.size === 0) {
        if (currentRoom.timer) clearInterval(currentRoom.timer);
        rooms.delete(currentRoom.code);
      } else {
        // Transfer host if the host left
        if (currentRoom.hostId === playerId) {
          const next = Array.from(currentRoom.players.values()).find((p) => p.connected);
          if (next) currentRoom.hostId = next.id;
        }
        broadcastRoomState(io, currentRoom);
        if (currentRoom.phase === "question" && allPlayersAnswered(currentRoom)) {
          endQuestion(io, currentRoom);
        }
      }

      currentRoom = null;
      playerId = null;
    });

    socket.on("disconnect", () => {
      if (!currentRoom || !playerId) return;
      const player = currentRoom.players.get(playerId);
      if (player) {
        player.connected = false;
      }

      // If all disconnected, clean up room after a delay
      const allDisconnected = Array.from(currentRoom.players.values()).every((p) => !p.connected);
      if (allDisconnected) {
        const code = currentRoom.code;
        setTimeout(() => {
          const room = rooms.get(code);
          if (room && Array.from(room.players.values()).every((p) => !p.connected)) {
            if (room.timer) clearInterval(room.timer);
            rooms.delete(code);
          }
        }, 30000);
      } else {
        broadcastRoomState(io, currentRoom);
        // If in question phase, check if all remaining connected players answered
        if (currentRoom.phase === "question" && allPlayersAnswered(currentRoom)) {
          endQuestion(io, currentRoom);
        }
      }
    });
  });
}
