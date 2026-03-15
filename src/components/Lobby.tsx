"use client";

import { useState } from "react";
import { RoomState } from "@/lib/types";
import { languages } from "@/data/questions";
import PlayerList from "./PlayerList";

export default function Lobby({
  roomState,
  currentPlayerId,
  onStart,
}: {
  roomState: RoomState;
  currentPlayerId: string | null;
  onStart: (language: string, topic: string) => void;
}) {
  const isHost = currentPlayerId === roomState.hostId;
  const [language, setLanguage] = useState(languages[0].id);
  const [topic, setTopic] = useState(languages[0].topics[0].id);

  const selectedLang = languages.find((l) => l.id === language) ?? languages[0];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Код комнаты</h2>
        <div className="text-5xl font-mono font-bold tracking-[0.3em] text-yellow-400">
          {roomState.code}
        </div>
        <p className="text-gray-400 mt-2 text-sm">Отправьте этот код друзьям</p>
      </div>

      <PlayerList
        players={roomState.players}
        hostId={roomState.hostId}
        currentPlayerId={currentPlayerId}
      />

      {isHost ? (
        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Язык</label>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setLanguage(lang.id);
                    setTopic(lang.topics[0].id);
                  }}
                  className={`py-3 px-4 rounded-xl text-center transition-all
                    ${language === lang.id
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  <div className="text-2xl">{lang.flag}</div>
                  <div className="text-xs mt-1">{lang.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Тема</label>
            <div className="grid grid-cols-1 gap-2">
              {selectedLang.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopic(t.id)}
                  className={`py-3 px-4 rounded-xl text-left transition-all
                    ${topic === t.id
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStart(language, topic)}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white text-lg font-bold rounded-xl transition-all active:scale-95"
          >
            Начать игру
          </button>
        </div>
      ) : (
        <div className="text-gray-400 text-center">
          <div className="animate-pulse text-lg">Ждём, пока хост начнёт игру...</div>
        </div>
      )}
    </div>
  );
}
