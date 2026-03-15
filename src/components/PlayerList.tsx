"use client";

import { Player } from "@/lib/types";

const COLORS = [
  "bg-pink-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-red-500",
];

export default function PlayerList({
  players,
  hostId,
  currentPlayerId,
}: {
  players: Player[];
  hostId: string;
  currentPlayerId: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {players.map((p, i) => (
        <div
          key={p.id}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium text-sm
            ${COLORS[i % COLORS.length]}
            ${!p.connected ? "opacity-40" : ""}
            ${p.id === currentPlayerId ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""}`}
        >
          <span>{p.name}</span>
          {p.id === hostId && <span className="text-xs opacity-75">(хост)</span>}
          {p.score > 0 && (
            <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">{p.score}</span>
          )}
        </div>
      ))}
    </div>
  );
}
