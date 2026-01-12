import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  ArrowLeft,
  Zap,
  TrendingDown,
  Ban,
  AlertTriangle,
  Circle,
  Target,
  Hand,
  Coffee,
  Clock,
} from "lucide-react";
import { LiveMatch } from "../../types";
import { supabase } from "../../supabaseClient";

interface LiveMatchPageProps {
  match: LiveMatch;
  onBack: () => void;
}

const ACTION_CONFIG: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  "simple-touch": {
    icon: Zap,
    color: "text-yellow-600",
    label: "Simple Touch",
  },
  "sudden-attack": {
    icon: Target,
    color: "text-red-600",
    label: "Sudden Attack",
  },
  "pole-dive": {
    icon: TrendingDown,
    color: "text-blue-600",
    label: "Pole Dive",
  },
  dive: { icon: TrendingDown, color: "text-indigo-600", label: "Dive" },
  tap: { icon: Hand, color: "text-purple-600", label: "Tap" },
  "turn-closure": {
    icon: Circle,
    color: "text-gray-600",
    label: "Turn Closure",
  },
  "out-of-field": { icon: Ban, color: "text-red-600", label: "Out of Field" },
  warning: { icon: AlertTriangle, color: "text-orange-600", label: "Warning" },
  "yellow-card": {
    icon: AlertTriangle,
    color: "text-yellow-600",
    label: "Yellow Card",
  },
  "red-card": { icon: AlertTriangle, color: "text-red-700", label: "Red Card" },
};

export function LiveMatchPage({ match, onBack }: LiveMatchPageProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [timerState, setTimerState] = useState({
    value: 0,
    status: "stopped", // 'running' | 'paused' | 'break' | 'stopped'
    lastUpdated: Date.now(),
    isLiveUpdate: false, // Flag to track if the update came from a subscription
  });

  const isLive = match.status?.toLowerCase() === "live";
  // Sort actions to show newest first
  const actions = match.actions ? [...match.actions].reverse() : [];

  // --- 1. REALTIME DB SYNC (Timer & Status) ---
  useEffect(() => {
    const fetchTimerState = async () => {
      const { data } = await supabase
        .from("matches")
        .select("timer_value, timer_status, updated_at")
        .eq("id", match.id)
        .single();

      if (data) {
        setTimerState({
          value: data.timer_value || 0,
          status: data.timer_status || "stopped",
          // For initial load, we must trust the DB timestamp, but clamp it later to avoid negative diffs
          lastUpdated: data.updated_at
            ? new Date(data.updated_at).getTime()
            : Date.now(),
          isLiveUpdate: false,
        });
      }
    };

    // Initial fetch
    fetchTimerState();

    // Realtime subscription
    const subscription = supabase
      .channel(`match-viewer-timer-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${match.id}`,
        },
        (payload) => {
          const newData = payload.new;
          setTimerState({
            value: newData.timer_value || 0,
            status: newData.timer_status || "stopped",
            // FIX: Use Date.now() (Reception Time) for live updates.
            // This ignores the Scorer's clock and uses the Viewer's clock as the new baseline,
            // preventing jumps caused by clock skew.
            lastUpdated: Date.now(),
            isLiveUpdate: true,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [match.id]);

  // --- 2. LOCAL CLOCK TICKER ---
  useEffect(() => {
    const updateDisplayTime = () => {
      // Static display if not running/break
      if (timerState.status !== "running" && timerState.status !== "break") {
        setCurrentTime(timerState.value);
        return;
      }

      const now = Date.now();
      let diff = Math.floor((now - timerState.lastUpdated) / 1000);

      // CORRECTION: If initial load and clocks are skewed (Scorer ahead of Viewer),
      // diff could be negative. We clamp it to 0 to prevent time traveling backwards.
      if (!timerState.isLiveUpdate && diff < 0) {
        diff = 0;
      }

      if (timerState.status === "running") {
        // Count UP for match time
        setCurrentTime(timerState.value + diff);
      } else if (timerState.status === "break") {
        // Count DOWN for break time
        setCurrentTime(Math.max(0, timerState.value - diff));
      }
    };

    updateDisplayTime(); // Immediate update on state change

    let interval: NodeJS.Timeout;
    if (timerState.status === "running" || timerState.status === "break") {
      interval = setInterval(updateDisplayTime, 1000);
    }

    return () => clearInterval(interval);
  }, [timerState]);

  const formatTimer = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatActionTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // --- 3. STATS CALCULATION ---
  const { attackerSummary } = useMemo(() => {
    const attStats: Record<string, any> = {};

    actions.forEach((action: any) => {
      if (action.attackerJersey && action.attackerName) {
        const key = `${action.attackerJersey}-${action.attackerName}`;
        if (!attStats[key]) {
          attStats[key] = {
            jersey: action.attackerJersey,
            name: action.attackerName,
            points: 0,
          };
        }
        attStats[key].points += action.points || 0;
      }
    });

    return {
      attackerSummary: Object.values(attStats).sort(
        (a: any, b: any) => b.points - a.points
      ),
    };
  }, [actions]);

  const lastAction = actions.length > 0 ? actions[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* SCOREBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Team A */}
          <Card className="bg-blue-50 border-blue-200 border-2">
            <CardContent className="p-4 md:p-6 text-center">
              <p className="text-sm text-gray-600 mb-1 font-bold">
                {match.teamA.name}
              </p>
              <p className="text-5xl text-gray-900 mb-1 font-black">
                {match.scoreA || 0}
              </p>
              <p className="text-xs text-gray-500">Team A</p>
            </CardContent>
          </Card>

          {/* Timer & Status */}
          <Card className="border-2 border-gray-200 bg-white">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {timerState.status === "running" && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 animate-pulse">
                    LIVE
                  </Badge>
                )}
                {timerState.status === "paused" && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                    PAUSED
                  </Badge>
                )}
                {timerState.status === "break" && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex gap-1 items-center">
                    <Coffee className="w-3 h-3" /> BREAK
                  </Badge>
                )}
                {(match.status === "finished" ||
                  timerState.status === "stopped") &&
                  !isLive && (
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                      FINISHED
                    </Badge>
                  )}
              </div>

              <p className="text-5xl text-gray-900 mb-1 font-mono">
                {formatTimer(currentTime)}
              </p>
              <p className="text-xs text-gray-500">
                Inning {match.currentInning || 1} • Turn{" "}
                {match.currentTurn || 1}
              </p>
            </CardContent>
          </Card>

          {/* Team B */}
          <Card className="bg-purple-50 border-purple-200 border-2">
            <CardContent className="p-4 md:p-6 text-center">
              <p className="text-sm text-gray-600 mb-1 font-bold">
                {match.teamB.name}
              </p>
              <p className="text-5xl text-gray-900 mb-1 font-black">
                {match.scoreB || 0}
              </p>
              <p className="text-xs text-gray-500">Team B</p>
            </CardContent>
          </Card>
        </div>

        {/* LAST ACTION */}
        {isLive && lastAction && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-600 mb-1 font-bold uppercase tracking-wide">
                Last Action
              </p>
              <p className="text-gray-900 text-lg">
                <span className="font-bold text-blue-700">
                  {lastAction.attackerName}
                </span>
                <span className="mx-2 text-gray-400">vs</span>
                <span className="font-bold text-purple-700">
                  {lastAction.defenderName || "Defender"}
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {lastAction.symbol} {lastAction.points > 0 ? "(OUT)" : ""}
              </p>
            </CardContent>
          </Card>
        )}

        {/* FEED & STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed - FIXED OVERFLOW */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200 h-[600px] flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-100 shrink-0">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Live Commentary
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                <ScrollArea className="h-full w-full">
                  <div className="p-4 space-y-4">
                    {actions.length === 0 ? (
                      <div className="text-center py-20 text-gray-400">
                        Match has just started. Waiting for action...
                      </div>
                    ) : (
                      actions.map((event: any, index: number) => {
                        const config = ACTION_CONFIG[event.symbol] || {
                          icon: Circle,
                          color: "text-gray-600",
                          label: event.symbol,
                        };
                        const Icon = config.icon;
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0"
                          >
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${config.color}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-sm font-bold ${config.color}`}
                                >
                                  {config.label}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatActionTime(event.timestamp)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">
                                  {event.attackerName}
                                </span>
                                {event.defenderName && (
                                  <>
                                    <span className="mx-1 text-gray-400">
                                      targeted
                                    </span>
                                    <span className="font-medium">
                                      {event.defenderName}
                                    </span>
                                  </>
                                )}
                              </div>
                              {event.points > 0 && (
                                <Badge className="mt-1 bg-red-100 text-red-700 border-red-200">
                                  + {event.points} PTS
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Top Attackers Panel */}
          <div className="space-y-4">
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Match Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Venue</span>
                  <span className="font-medium">{match.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">
                    {new Date(match.dateTime).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Top Attackers (Live)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {attackerSummary.length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {attackerSummary.slice(0, 5).map((p: any) => (
                        <tr key={p.jersey}>
                          <td className="p-3">{p.name}</td>
                          <td className="p-3 text-right font-bold">
                            {p.points} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No stats yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
