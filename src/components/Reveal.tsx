"use client";

import { RevealPayload, RoomState } from "@/lib/types";

export default function Reveal({
  reveal,
  roomState,
  lastQuestion,
  currentPlayerId,
}: {
  reveal: RevealPayload;
  roomState: RoomState;
  lastQuestion: { phrase: string; options: string[] } | null;
  currentPlayerId: string | null;
}) {
  const myResult = reveal.playerResults.find((r) => r.playerId === currentPlayerId);
  const sorted = [...reveal.playerResults].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="text-gray-400 text-sm">
        Раунд {roomState.round} из {roomState.totalRounds}
      </div>

      {/* Show the answer options with correct highlighted */}
      {lastQuestion && (
        <div className="w-full space-y-2">
          <p className="text-center text-xl font-bold text-white mb-3">{lastQuestion.phrase}</p>
          {lastQuestion.options.map((option, i) => {
            const isCorrect = i === reveal.correctIndex;
            const wasMyAnswer = myResult?.answerIndex === i;
            return (
              <div
                key={i}
                className={`py-3 px-5 rounded-xl text-lg font-medium flex items-center justify-between
                  ${isCorrect
                    ? "bg-green-600 text-white"
                    : wasMyAnswer && !myResult?.correct
                      ? "bg-red-600/50 text-red-200"
                      : "bg-gray-800/50 text-gray-500"
                  }`}
              >
                <span>{option}</span>
                {isCorrect && <span>✓</span>}
                {wasMyAnswer && !isCorrect && <span>✗</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Points earned */}
      {myResult && (
        <div className={`text-center text-2xl font-bold ${myResult.correct ? "text-green-400" : "text-red-400"}`}>
          {myResult.correct ? `+${myResult.pointsEarned} очков!` : "Без очков"}
        </div>
      )}

      {/* Live standings */}
      <div className="w-full bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-sm text-gray-400 mb-3 text-center">Таблица</h3>
        <div className="space-y-2">
          {sorted.map((r, i) => (
            <div
              key={r.playerId}
              className={`flex items-center justify-between px-3 py-2 rounded-lg
                ${r.playerId === currentPlayerId ? "bg-gray-700" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-5">{i + 1}.</span>
                <span className="text-white font-medium">{r.playerName}</span>
              </div>
              <div className="flex items-center gap-3">
                {r.pointsEarned > 0 && (
                  <span className="text-green-400 text-sm">+{r.pointsEarned}</span>
                )}
                <span className="text-gray-300 font-bold">{r.totalScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-gray-500 text-sm animate-pulse">Следующий вопрос...</p>
    </div>
  );
}
