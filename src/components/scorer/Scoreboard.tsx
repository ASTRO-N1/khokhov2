import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Play,
  Pause,
  Trash2,
  ChevronRight,
  Power,
  AlertTriangle,
} from "lucide-react";
import { Match } from "../../types";

interface ScoreboardProps {
  match: Match;
  scores: { teamA: number; teamB: number };
  timer: number;
  maxTimerDuration: number;
  isTimerRunning: boolean;
  currentInning: number;
  currentTurn: number;
  onToggleTimer: (run: boolean) => void;
  onUndo: () => void;
  onNextTurn: () => void;
  onEndMatch: () => void;
}

export function Scoreboard({
  match,
  scores,
  timer,
  maxTimerDuration,
  isTimerRunning,
  currentInning,
  currentTurn,
  onToggleTimer,
  onUndo,
  onNextTurn,
  onEndMatch,
}: ScoreboardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
        {/* Scores and Timer */}
        <div className="flex items-center justify-center gap-6 mb-3">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{match.teamA.name}</p>
            <div className="bg-blue-50 border-2 border-blue-600 rounded-lg px-4 py-2">
              <p className="text-3xl text-blue-600">{scores.teamA}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">
              Timer (Max: {formatTime(maxTimerDuration)})
            </p>
            <div
              className={`rounded-lg px-6 py-2 shadow-md ${
                timer >= maxTimerDuration
                  ? "bg-gradient-to-r from-red-600 to-pink-600"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600"
              }`}
            >
              <p className="text-white text-4xl font-mono tracking-wider">
                {formatTime(timer)}
              </p>
            </div>
            {timer >= maxTimerDuration && (
              <p className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Max time reached
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{match.teamB.name}</p>
            <div className="bg-red-50 border-2 border-red-600 rounded-lg px-4 py-2">
              <p className="text-3xl text-red-600">{scores.teamB}</p>
            </div>
          </div>
        </div>

        {/* Badges and Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 px-3 py-1">
              Inning {currentInning}
            </Badge>
            <Badge className="bg-indigo-600 px-3 py-1">
              Turn {currentTurn}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onToggleTimer(true)}
              disabled={isTimerRunning}
              size="sm"
              className="bg-green-600 hover:bg-green-700 h-9"
            >
              <Play className="w-4 h-4 mr-1" /> Start
            </Button>
            <Button
              onClick={() => onToggleTimer(false)}
              disabled={!isTimerRunning}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 h-9"
            >
              <Pause className="w-4 h-4 mr-1" /> Pause
            </Button>
            <Button
              onClick={onUndo}
              variant="outline"
              size="sm"
              className="h-9 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Undo
            </Button>
            <Button
              onClick={onNextTurn}
              variant="outline"
              size="sm"
              className="h-9 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              <ChevronRight className="w-4 h-4 mr-1" /> Next Turn
            </Button>
            <Button
              onClick={onEndMatch}
              variant="outline"
              size="sm"
              className="h-9 border-red-600 text-red-600 hover:bg-red-50"
            >
              <Power className="w-4 h-4 mr-1" /> End Match
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
