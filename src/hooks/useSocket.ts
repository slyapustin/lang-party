"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type {
  RoomState,
  QuestionPayload,
  RevealPayload,
  GameOverPayload,
  ServerEvents,
  ClientEvents,
} from "@/lib/types";

type TypedSocket = Socket<ServerEvents, ClientEvents>;

let globalSocket: TypedSocket | null = null;

function getSocket(): TypedSocket {
  if (!globalSocket) {
    globalSocket = io({ autoConnect: false });
  }
  return globalSocket;
}

export function useSocket() {
  const socketRef = useRef<TypedSocket>(getSocket());
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [gameOver, setGameOver] = useState<GameOverPayload | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onRoomState = (state: RoomState) => setRoomState(state);
    const onQuestion = (q: QuestionPayload) => {
      setQuestion(q);
      setReveal(null);
      setGameOver(null);
      setTimeLeft(q.timeLimit);
    };
    const onTick = ({ timeLeft: tl }: { timeLeft: number }) => setTimeLeft(tl);
    const onReveal = (r: RevealPayload) => {
      setReveal(r);
      setQuestion(null);
    };
    const onGameOver = (g: GameOverPayload) => {
      setGameOver(g);
      setQuestion(null);
      setReveal(null);
    };
    const onError = ({ message }: { message: string }) => setError(message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room-state", onRoomState);
    socket.on("question", onQuestion);
    socket.on("tick", onTick);
    socket.on("reveal", onReveal);
    socket.on("game-over", onGameOver);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room-state", onRoomState);
      socket.off("question", onQuestion);
      socket.off("tick", onTick);
      socket.off("reveal", onReveal);
      socket.off("game-over", onGameOver);
      socket.off("error", onError);
    };
  }, []);

  const joinRoom = useCallback((code: string, playerName: string, playerId: string) => {
    setError(null);
    socketRef.current.emit("join-room", { code, playerName, playerId });
  }, []);

  const startGame = useCallback((language: string, topic: string) => {
    socketRef.current.emit("start-game", { language, topic });
  }, []);

  const submitAnswer = useCallback((answerIndex: number) => {
    socketRef.current.emit("answer", { answerIndex });
  }, []);

  const playAgain = useCallback(() => {
    socketRef.current.emit("play-again");
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current.emit("leave-room");
    setRoomState(null);
    setQuestion(null);
    setReveal(null);
    setGameOver(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    socketId: socketRef.current.id ?? null,
    connected,
    roomState,
    question,
    reveal,
    gameOver,
    timeLeft,
    error,
    joinRoom,
    startGame,
    submitAnswer,
    playAgain,
    leaveRoom,
    clearError,
  };
}
