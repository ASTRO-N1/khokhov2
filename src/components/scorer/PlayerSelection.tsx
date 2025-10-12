// src/components/scorer/PlayerSelection.tsx

import { Player } from "../../types";

interface PlayerSelectionProps {
  players: Player[];
  selectedPlayer?: number | null;
  onSelectPlayer: (jerseyNumber: number) => void;
  title: string;
}

export function PlayerSelection({
  players,
  selectedPlayer,
  onSelectPlayer,
  title,
}: PlayerSelectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player.jerseyNumber)}
            className={`p-2 border-2 rounded-lg text-center transition-all ${
              selectedPlayer === player.jerseyNumber
                ? "border-blue-600 bg-blue-50 font-bold"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <div className="text-lg">#{player.jerseyNumber}</div>
            <div className="text-xs truncate text-gray-600">{player.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
