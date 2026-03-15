"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import Lobby from "@/components/Lobby";
import Question from "@/components/Question";
import Reveal from "@/components/Reveal";
import Scoreboard from "@/components/Scoreboard";
import PlayerList from "@/components/PlayerList";

function getPlayerId(): string {
  let pid = sessionStorage.getItem("playerId");
  if (!pid) {
    pid = crypto.randomUUID();
    sessionStorage.setItem("playerId", pid);
  }
  return pid;
}

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const {
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
  } = useSocket();

  const [joined, setJoined] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const lastQuestionRef = useRef<{ phrase: string; options: string[] } | null>(null);

  // Track the last question for the reveal screen
  useEffect(() => {
    if (question) {
      lastQuestionRef.current = { phrase: question.phrase, options: question.options };
    }
  }, [question]);

  // Join room once connected
  useEffect(() => {
    if (connected && !joined) {
      const playerName = sessionStorage.getItem("playerName");
      if (!playerName) {
        router.push("/");
        return;
      }
      const pid = getPlayerId();
      setMyId(pid);
      joinRoom(code, playerName, pid);
      setJoined(true);
    }
  }, [connected, joined, code, joinRoom, router]);

  // Error handling
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleLeave = () => {
    leaveRoom();
    setJoined(false);
    router.push("/");
  };

  if (!connected) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-gray-400 text-lg animate-pulse">Подключение...</p>
      </main>
    );
  }

  if (!roomState) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg animate-pulse">Входим в комнату {code}...</p>
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-xl">
            {error}
          </div>
        )}
      </main>
    );
  }

  const isHost = myId === roomState.hostId;

  return (
    <main className="min-h-dvh flex flex-col p-4 pt-0 pb-8 relative">
      {/* Top bar */}
      <header className="flex items-center justify-between py-3 -mx-4 px-4 sticky top-0 z-40 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-gray-400 shrink-0">{roomState.code}</span>
          {roomState.phase !== "lobby" && (
            <span className="text-xs text-gray-600 truncate">
              {roomState.round > 0 && `${roomState.round}/${roomState.totalRounds}`}
            </span>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="3" r="1.5" fill="currentColor" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
            <circle cx="9" cy="15" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-4 top-12 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[200px]">
            {roomState.phase !== "lobby" && isHost && (
              <button
                onClick={() => { playAgain(); setMenuOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3"
              >
                <span className="text-base">↩</span>
                В лобби
              </button>
            )}
            <button
              onClick={() => { handleLeave(); setMenuOpen(false); }}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-3"
            >
              <span className="text-base">✕</span>
              Выйти из комнаты
            </button>
          </div>
        </>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 text-red-200 px-5 py-3 rounded-xl z-50 animate-pulse">
          {error}
        </div>
      )}

      {/* Header with player list during game */}
      {roomState.phase !== "lobby" && roomState.phase !== "game-over" && (
        <div className="mb-4 pt-1">
          <PlayerList
            players={roomState.players}
            hostId={roomState.hostId}
            currentPlayerId={myId}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        {roomState.phase === "lobby" && (
          <Lobby
            roomState={roomState}
            currentPlayerId={myId}
            onStart={startGame}
          />
        )}

        {roomState.phase === "question" && question && (
          <Question
            question={question}
            timeLeft={timeLeft}
            onAnswer={submitAnswer}
          />
        )}

        {roomState.phase === "reveal" && reveal && (
          <Reveal
            reveal={reveal}
            roomState={roomState}
            lastQuestion={lastQuestionRef.current}
            currentPlayerId={myId}
          />
        )}

        {roomState.phase === "game-over" && gameOver && (
          <Scoreboard
            gameOver={gameOver}
            isHost={isHost}
            currentPlayerId={myId}
            onPlayAgain={playAgain}
          />
        )}
      </div>
    </main>
  );
}
