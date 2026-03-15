"use client";

import { GameOverPayload } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Scoreboard({
  gameOver,
  isHost,
  currentPlayerId,
  onPlayAgain,
}: {
  gameOver: GameOverPayload;
  isHost: boolean;
  currentPlayerId: string | null;
  onPlayAgain: () => void;
}) {
  const winner = gameOver.rankings[0];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Игра окончена!</h2>
        {winner && (
          <p className="text-xl text-yellow-400">
            🏆 {winner.playerName} победил!
          </p>
        )}
      </div>

      <div className="w-full space-y-3">
        {gameOver.rankings.map((r) => (
          <div
            key={r.playerId}
            className={`flex items-center justify-between px-5 py-4 rounded-xl
              ${r.rank === 1
                ? "bg-yellow-600/20 border border-yellow-600/40"
                : r.playerId === currentPlayerId
                  ? "bg-gray-700"
                  : "bg-gray-800"
              }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl w-8 text-center">
                {r.rank <= 3 ? MEDALS[r.rank - 1] : r.rank}
              </span>
              <span className={`font-medium text-lg ${r.rank === 1 ? "text-yellow-400" : "text-white"}`}>
                {r.playerName}
              </span>
            </div>
            <span className="text-xl font-bold text-gray-300">{r.score}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button
          onClick={onPlayAgain}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold rounded-xl transition-all active:scale-95"
        >
          Играть снова
        </button>
      ) : (
        <p className="text-gray-400 animate-pulse">Ждём, пока хост начнёт новую игру...</p>
      )}
    </div>
  );
}
