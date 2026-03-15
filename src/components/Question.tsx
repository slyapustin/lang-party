"use client";

import { useState } from "react";
import { QuestionPayload } from "@/lib/types";

export default function Question({
  question,
  timeLeft,
  onAnswer,
}: {
  question: QuestionPayload;
  timeLeft: number;
  onAnswer: (index: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const progress = (timeLeft / question.timeLimit) * 100;

  const handleAnswer = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    onAnswer(index);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Round indicator */}
      <div className="text-gray-400 text-sm">
        Раунд {question.round} из {question.totalRounds}
      </div>

      {/* Timer */}
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="16"
            fill="none" stroke="#374151" strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="16"
            fill="none"
            stroke={timeLeft <= 5 ? "#ef4444" : "#6366f1"}
            strokeWidth="3"
            strokeDasharray="100"
            strokeDashoffset={100 - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold
          ${timeLeft <= 5 ? "text-red-400" : "text-white"}`}>
          {timeLeft}
        </div>
      </div>

      {/* Phrase */}
      <div className="bg-gray-800 w-full rounded-2xl p-6 text-center">
        <p className="text-sm text-gray-400 mb-1">Переведите фразу:</p>
        <p className="text-3xl font-bold text-white">{question.phrase}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3 w-full">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            disabled={selected !== null}
            className={`py-4 px-6 rounded-xl text-lg font-medium transition-all active:scale-[0.98]
              ${selected === i
                ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                : selected !== null
                  ? "bg-gray-800 text-gray-500"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
          >
            {option}
          </button>
        ))}
      </div>

      {selected !== null && (
        <p className="text-gray-400 animate-pulse">Ждём остальных игроков...</p>
      )}
    </div>
  );
}
