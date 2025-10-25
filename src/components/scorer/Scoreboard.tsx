import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Play,
  Pause,
  Trash2,
  ChevronRight,
  Power,
  AlertTriangle,
  RotateCcw,
  Coffee, // Import Coffee icon for break
  SkipForward, // Import SkipForward icon
} from "lucide-react";
import { Match } from "../../types";
import { cn } from "../ui/utils"; // Import cn utility

interface ScoreboardProps {
  match: Match;
  scores: { teamA: number; teamB: number };
  timer: number; // Match timer
  maxTimerDuration: number;
  isTimerRunning: boolean;
  currentInning: number;
  currentTurn: number;
  onToggleTimer: (run: boolean) => void;
  onUndo: () => void;
  onNextTurn: () => void;
  onEndMatch: () => void;
  onResetTimer: () => void;
  isOnBreak: boolean;
  breakTimer: number; // Break timer countdown
  breakType: "turn" | "inning" | null;
  onSkipBreak: () => void;
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
  onResetTimer,
  isOnBreak,
  breakTimer,
  breakType,
  onSkipBreak,
}: ScoreboardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const timerDisplayValue = isOnBreak ? breakTimer : timer;
  const timerLabel = isOnBreak
    ? `${breakType === "inning" ? "Inning" : "Turn"} Break`
    : `Timer (Max: ${formatTime(maxTimerDuration)})`;
  // Define base class and conditional classes separately
  const timerBgBaseClass = "rounded-lg px-6 py-2 shadow-md";
  const timerBgClass = isOnBreak
    ? "bg-gradient-to-r from-yellow-500 to-orange-500" // Distinct break timer background
    : timer >= maxTimerDuration
    ? "bg-gradient-to-r from-red-600 to-pink-600" // Max time reached background
    : "bg-gradient-to-r from-blue-600 to-indigo-600"; // Normal match timer background

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
        {/* Scores and Timer Display */}
        <div className="flex items-center justify-center gap-6 mb-3">
          {/* Team A Score */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{match.teamA.name}</p>
            {/* Apply opacity during break - FIXED: opacity remains on score */}
            <div
              className={cn(
                "bg-blue-50 border-2 rounded-lg px-4 py-2 transition-opacity",
                isOnBreak ? "opacity-50 border-gray-300" : "border-blue-600"
              )}
            >
              <p
                className={cn(
                  "text-3xl transition-colors",
                  isOnBreak ? "text-gray-400" : "text-blue-600"
                )}
              >
                {scores.teamA}
              </p>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
              {/* Show coffee icon during break */}
              {isOnBreak && <Coffee className="w-4 h-4 text-yellow-700" />}
              {timerLabel}
            </p>
            {/* Combine base and conditional background classes */}
            <div className={cn(timerBgBaseClass, timerBgClass)}>
              <p className="text-white text-4xl font-mono tracking-wider">
                {formatTime(timerDisplayValue)}
              </p>
            </div>
            {/* Only show max time warning for match timer */}
            {timer >= maxTimerDuration && !isOnBreak && (
              <p className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Max time reached
              </p>
            )}
          </div>

          {/* Team B Score */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{match.teamB.name}</p>
            {/* Apply opacity during break - FIXED: opacity remains on score */}
            <div
              className={cn(
                "bg-red-50 border-2 rounded-lg px-4 py-2 transition-opacity",
                isOnBreak ? "opacity-50 border-gray-300" : "border-red-600"
              )}
            >
              <p
                className={cn(
                  "text-3xl transition-colors",
                  isOnBreak ? "text-gray-400" : "text-red-600"
                )}
              >
                {scores.teamB}
              </p>
            </div>
          </div>
        </div>

        {/* Badges and Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Badges (Removed opacity during break to match desired screenshot) */}
          <div
            className={cn(
              "flex items-center gap-2 transition-opacity"
              // REMOVED: isOnBreak ? "opacity-50" : ""
            )}
          >
            <Badge className="bg-blue-600 px-3 py-1">
              Inning {currentInning}
            </Badge>
            <Badge className="bg-indigo-600 px-3 py-1">
              Turn {currentTurn}
            </Badge>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            {/* Show normal controls ONLY if not on break */}
            {!isOnBreak ? (
              <>
                <Button
                  onClick={() => onToggleTimer(true)}
                  disabled={isTimerRunning || timer >= maxTimerDuration}
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
                  onClick={onResetTimer}
                  variant="outline"
                  size="sm"
                  className="h-9 border-gray-400 text-gray-600 hover:bg-gray-100"
                >
                  <RotateCcw className="w-4 h-4 mr-1" /> Reset
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
              </>
            ) : (
              // Show ONLY Skip Break button during break
              <>
                <Button
                  onClick={onSkipBreak}
                  variant="outline"
                  size="sm"
                  className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
                >
                  <SkipForward className="w-4 h-4 mr-1 bg-red-500 h-10 w-10" />{" "}
                  Skip Break
                </Button>
                {/* Render placeholder buttons to maintain layout */}
                <div className="w-[70px] h-9"></div>{" "}
                {/* Placeholder for Start */}
                <div className="w-[76px] h-9"></div>{" "}
                {/* Placeholder for Pause */}
                <div className="w-[79px] h-9"></div>{" "}
                {/* Placeholder for Reset */}
                <div className="w-[74px] h-9"></div>{" "}
                {/* Placeholder for Undo */}
                <div className="w-[101px] h-9"></div>
                {/* Placeholder for Next Turn */}
                <div className="w-[108px] h-9"></div>
                {/* Placeholder for End Match */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
