"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"idle" | "join">("idle");
  const router = useRouter();

  const ensurePlayerId = () => {
    let id = sessionStorage.getItem("playerId");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("playerId", id);
    }
    return id;
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const code = Array.from({ length: 4 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)]
    ).join("");
    sessionStorage.setItem("playerName", name.trim());
    ensurePlayerId();
    router.push(`/room/${code}`);
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    sessionStorage.setItem("playerName", name.trim());
    ensurePlayerId();
    router.push(`/room/${roomCode.toUpperCase()}`);
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">
            Lang Party
          </h1>
          <p className="text-gray-400">Мультиплеер-игра для изучения языков</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="w-full px-5 py-4 bg-gray-800 text-white rounded-xl text-lg placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {mode === "idle" ? (
            <div className="space-y-3">
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-lg font-bold rounded-xl transition-all active:scale-95"
              >
                Создать комнату
              </button>
              <button
                onClick={() => setMode("join")}
                disabled={!name.trim()}
                className="w-full py-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-white text-lg font-medium rounded-xl transition-all active:scale-95"
              >
                Войти в комнату
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Код комнаты (напр. ABCD)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
                maxLength={4}
                className="w-full px-5 py-4 bg-gray-800 text-white rounded-xl text-lg text-center tracking-[0.3em] font-mono placeholder:text-gray-500 placeholder:tracking-normal placeholder:font-sans outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                onClick={handleJoin}
                disabled={!name.trim() || roomCode.length !== 4}
                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-lg font-bold rounded-xl transition-all active:scale-95"
              >
                Войти
              </button>
              <button
                onClick={() => { setMode("idle"); setRoomCode(""); }}
                className="w-full py-3 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Назад
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
