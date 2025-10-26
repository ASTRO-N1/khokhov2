// design/src/components/TurnByTurnResultView.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Match, ScoringAction, Team, Player, SymbolType } from "../types"; // Ensure SymbolType is imported
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Trophy,
  Clock,
  Users,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ConsolidatedReport } from "./scorer/ConsolidatedReport"; // <-- CORRECT path (in scorer folder)
import { MatchSetupData } from "./scorer/MatchSetupEnhanced"; // <-- CORRECT path (in scorer folder)
import { Dialog, DialogContent } from "./ui/dialog"; // Import Dialog components

// --- Helper Functions ---
const formatTime = (seconds: number | null | undefined): string => {
  const num = Number(seconds);
  if (isNaN(num) || num < 0) {
    return "00:00";
  }
  const mins = Math.floor(num / 60);
  const secs = num % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const getStringValue = (action: any, key: string): string | null => {
  const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  const snakeCaseKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
  const val = action[camelCaseKey] ?? action[snakeCaseKey];
  return typeof val === "string" && val ? val : null;
};

const getNumValue = (action: any, key: string): number => {
  const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  const snakeCaseKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
  const val = action[camelCaseKey] ?? action[snakeCaseKey];
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// SYMBOLS remain the same
const SYMBOLS: {
  type: SymbolType;
  name: string;
  abbr: string;
  points: number;
  singlePlayer?: boolean;
}[] = [
  { type: "simple-touch", name: "Simple Touch (S)", abbr: "S", points: 1 },
  { type: "sudden-attack", name: "Sudden Attack (SA)", abbr: "SA", points: 1 },
  { type: "pole-dive", name: "Pole Dive (P)", abbr: "P", points: 1 },
  { type: "tap", name: "Tap (T)", abbr: "T", points: 1 },
  { type: "dive", name: "Dive (D)", abbr: "D", points: 1 },
  { type: "turn-closure", name: "Turn Closure (][)", abbr: "][", points: 0 },
  { type: "late-entry", name: "Late Entry (L)", abbr: "L", points: 1 },
  {
    type: "out-of-field",
    name: "Out of Field (O)",
    abbr: "O",
    points: 1,
    singlePlayer: true,
  },
  { type: "retired", name: "Retired (R)", abbr: "R", points: 0 },
  {
    type: "warning",
    name: "Warning (W)",
    abbr: "W",
    points: 0,
    singlePlayer: true,
  },
  {
    type: "yellow-card",
    name: "Yellow Card (Y)",
    abbr: "Y",
    points: 0,
    singlePlayer: true,
  },
  {
    type: "red-card",
    name: "Red Card (F)",
    abbr: "F",
    points: 0,
    singlePlayer: true,
  },
];

// Define interfaces for turn-specific stats
interface TurnDefenderStat {
  jerseyNumber: number | null;
  name: string | null;
  perTime: number;
  runTime: number;
  outBy: string | null;
  symbol: SymbolType | string;
}

interface TurnAttackerStat {
  jerseyNumber: number;
  name: string | null;
  points: number;
  defendersOut: string[];
}

export function TurnByTurnResultView() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  // Store actions using the more specific DbScoringAction type if possible
  const [actions, setActions] = useState<any[]>([]); // Use any initially, refine later if needed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTurnNumber, setCurrentTurnNumber] = useState(1); // Turn number (1, 2, 3, 4...)
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Calculate total turns once actions are loaded
  const totalTurns = useMemo(() => {
    if (!actions || actions.length === 0) return 0;
    return Math.max(...actions.map((a) => getNumValue(a, "turn")), 0);
  }, [actions]);

  useEffect(() => {
    const fetchData = async () => {
      // ...(Data fetching logic remains the same as previous step)...
      if (!matchId) {
        setError("Match ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select(
            `
                *,
                team_a:teams!matches_team_a_id_fkey(*, players!team_id(*)),
                team_b:teams!matches_team_b_id_fkey(*, players!team_id(*)),
                tournament:tournaments(*)
              `
          )
          .eq("id", matchId)
          .single();

        if (matchError)
          throw new Error(
            `Failed to fetch match details: ${matchError.message}`
          );
        if (!matchData) throw new Error(`Match not found.`);

        const formattedMatch: Match = {
          id: matchData.id,
          matchNumber:
            matchData.match_number || `M-${matchData.id.substring(0, 4)}`, // Fallback match number
          tournamentId: matchData.tournament.id,
          tournamentName: matchData.tournament.name,
          teamA: {
            id: matchData.team_a.id,
            name: matchData.team_a.name,
            captain: matchData.team_a.captain_name,
            players: (matchData.team_a.players || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              jerseyNumber: p.jersey_number,
              teamId: p.team_id,
              role: "playing",
              isActive: true,
            })),
          },
          teamB: {
            id: matchData.team_b.id,
            name: matchData.team_b.name,
            captain: matchData.team_b.captain_name,
            players: (matchData.team_b.players || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              jerseyNumber: p.jersey_number,
              teamId: p.team_id,
              role: "playing",
              isActive: true,
            })),
          },
          dateTime: matchData.match_datetime,
          venue: matchData.venue,
          status: matchData.status,
          scoreA: matchData.score_a,
          scoreB: matchData.score_b,
          innings: matchData.innings,
          turnDuration: matchData.turn_duration,
          tossWinner: matchData.toss_winner,
          tossDecision: matchData.toss_decision,
          playersPerTeam: matchData.players_per_team,
        };
        setMatch(formattedMatch);

        const { data: actionsData, error: actionsError } = await supabase
          .from("scoring_actions")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true });

        if (actionsError)
          throw new Error(
            `Failed to fetch scoring actions: ${actionsError.message}`
          );

        setActions(actionsData || []); // Ensure actions is an array
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchId]);

  // ---- Logic to determine data for the CURRENT turn ----
  const currentTurnData = useMemo(() => {
    if (
      !match ||
      totalTurns === 0 ||
      currentTurnNumber > totalTurns ||
      currentTurnNumber < 1
    ) {
      return null;
    }

    const inningNumber = Math.ceil(currentTurnNumber / 2);

    // Determine who was defending (careful with null checks for tossWinner/Decision)
    const tossWinner = match.tossWinner || "A"; // Default assumption if null
    const tossDecision = match.tossDecision || "attack"; // Default assumption if null

    const isTeamADefending =
      (tossWinner === "A" &&
        tossDecision === "defend" &&
        currentTurnNumber % 2 !== 0) ||
      (tossWinner === "A" &&
        tossDecision === "attack" &&
        currentTurnNumber % 2 === 0) ||
      (tossWinner === "B" &&
        tossDecision === "attack" &&
        currentTurnNumber % 2 !== 0) ||
      (tossWinner === "B" &&
        tossDecision === "defend" &&
        currentTurnNumber % 2 === 0);

    const defendingTeam = isTeamADefending ? match.teamA : match.teamB;
    const attackingTeam = isTeamADefending ? match.teamB : match.teamA;

    const turnActions = actions.filter(
      (a) => getNumValue(a, "turn") === currentTurnNumber
    );

    const actionsUpToTurnEnd = actions.filter(
      (a) => getNumValue(a, "turn") <= currentTurnNumber
    );
    const scoreA = actionsUpToTurnEnd
      .filter((a) => getStringValue(a, "scoring_team_id") === match.teamA.id)
      .reduce((sum, a) => sum + getNumValue(a, "points"), 0);
    const scoreB = actionsUpToTurnEnd
      .filter((a) => getStringValue(a, "scoring_team_id") === match.teamB.id)
      .reduce((sum, a) => sum + getNumValue(a, "points"), 0);

    // --- Calculate Turn-Specific Defender Stats ---
    const defenderStats: TurnDefenderStat[] = turnActions
      .filter((action) => getStringValue(action, "defenderName"))
      .map((action) => ({
        jerseyNumber: getNumValue(action, "defenderJersey"),
        name: getStringValue(action, "defenderName"),
        perTime: getNumValue(action, "perTime"),
        runTime: getNumValue(action, "runTime"),
        outBy: getStringValue(action, "attackerName"),
        symbol: (getStringValue(action, "symbol") as SymbolType) || "unknown",
      }));

    // --- Calculate Turn-Specific Attacker Stats ---
    const attackerStatsMap: { [key: number]: TurnAttackerStat } = {};
    turnActions.forEach((action) => {
      const attackerJersey = getNumValue(action, "attackerJersey");
      const attackerName = getStringValue(action, "attackerName");
      const defenderName = getStringValue(action, "defenderName");
      const points = getNumValue(action, "points");

      if (!attackerJersey || !attackerName) return; // Skip if no attacker involved

      if (!attackerStatsMap[attackerJersey]) {
        attackerStatsMap[attackerJersey] = {
          jerseyNumber: attackerJersey,
          name: attackerName,
          points: 0,
          defendersOut: [],
        };
      }
      attackerStatsMap[attackerJersey].points += points;
      if (defenderName && points > 0) {
        // Only count defenders out if points were scored
        attackerStatsMap[attackerJersey].defendersOut.push(defenderName);
      }
    });
    const attackerStats = Object.values(attackerStatsMap);

    return {
      inningNumber,
      turnNumber: currentTurnNumber,
      defendingTeam,
      attackingTeam,
      turnActions,
      scoreA,
      scoreB,
      defenderStats,
      attackerStats,
    };
  }, [match, actions, currentTurnNumber, totalTurns]);

  // ---- Navigation Handlers ----
  const goToNextTurn = () => {
    if (currentTurnNumber < totalTurns) {
      setCurrentTurnNumber((prev) => prev + 1);
    } else if (currentTurnNumber === totalTurns) {
      // Show summary modal when clicking next on the last turn
      setShowSummaryModal(true);
    }
  };

  const goToPreviousTurn = () => {
    if (currentTurnNumber > 1) {
      setCurrentTurnNumber((prev) => prev - 1);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page in history
  };

  // Reconstruct setupData for ConsolidatedReport (basic version)
  const reconstructedSetupData: MatchSetupData | undefined = match
    ? {
        teamAPlaying: match.teamA.players, // Assuming players array holds all members
        teamASubstitutes: [],
        teamBPlaying: match.teamB.players,
        teamBSubstitutes: [],
        tossWinner: (match.tossWinner as "A" | "B") || "A",
        tossDecision: (match.tossDecision as "attack" | "defend") || "attack",
        playersPerTeam: (match.playersPerTeam as 7 | 9) || 9, // Default to 9 if missing
        timerDuration: match.turnDuration || 540, // Default to 9 mins if missing
      }
    : undefined;

  // ---- Render Logic ----
  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />{" "}
        Loading Match Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto text-center">
        <Button onClick={handleGoBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Match</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-6 text-center text-gray-500">
        Match data could not be loaded. Please go back.
      </div>
    );
  }

  if (!currentTurnData && totalTurns > 0) {
    // This case should ideally not happen if totalTurns is calculated correctly
    return (
      <div className="p-6 space-y-4">
        <Button onClick={handleGoBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <p className="text-center text-orange-600 py-8">
          Could not load data for turn {currentTurnNumber}.
        </p>
      </div>
    );
  }

  // Handle case with no actions recorded at all
  if (totalTurns === 0 && !loading) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <Button onClick={handleGoBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Match Results: {match.matchNumber}</CardTitle>
            <p className="text-sm text-gray-500">{match.tournamentName}</p>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              No scoring actions were recorded for this match.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Turn Display ---
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto pb-20">
      {" "}
      {/* Added bottom padding */}
      <div className="flex justify-between items-center">
        <Button onClick={handleGoBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
        </Button>
        {/* Show View Summary button only on the last turn */}
        {currentTurnNumber === totalTurns && (
          <Button
            onClick={() => setShowSummaryModal(true)}
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Trophy className="w-4 h-4 mr-2" /> View Final Summary
          </Button>
        )}
      </div>
      {/* --- ADD CHECK HERE --- */}
      {currentTurnData ? (
        <>
          {/* Turn Header */}
          <Card className="shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-2 md:mb-0">
                  <Badge className="bg-white/20 text-white mb-2">
                    Inning {currentTurnData.inningNumber} / Turn{" "}
                    {currentTurnData.turnNumber}
                  </Badge>
                  <h2 className="text-2xl font-bold">
                    {match.matchNumber} - Turn Replay
                  </h2>
                  <p className="text-blue-100 mt-1">{match.tournamentName}</p>
                </div>
                <div className="text-left md:text-right bg-black/20 p-3 rounded-lg backdrop-blur-sm border border-white/20">
                  <p className="text-sm text-blue-100 mb-1">
                    Score after this turn:
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {match.teamA.name}: {currentTurnData.scoreA}
                    <span className="mx-2 text-blue-200">|</span>
                    {match.teamB.name}: {currentTurnData.scoreB}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center text-sm text-blue-100 border-t border-white/20 pt-2">
                <span>
                  <span className="font-semibold">
                    {currentTurnData.attackingTeam.name}
                  </span>{" "}
                  attacking
                </span>
                <span>
                  <span className="font-semibold">
                    {currentTurnData.defendingTeam.name}
                  </span>{" "}
                  defending
                </span>
              </div>
            </CardHeader>
          </Card>

          {/* Turn Details */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Defender Log */}
            <Card className="shadow-sm border-t-4 border-blue-500">
              <CardHeader className="bg-blue-50 border-b py-3 px-4">
                <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Defender Actions ({currentTurnData.defendingTeam.name})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-4 pb-4">
                {currentTurnData.defenderStats.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">
                    No defenders out this turn.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentTurnData.defenderStats.map((stat, idx) => {
                      const symbolInfo = SYMBOLS.find(
                        (s) => s.type === stat.symbol
                      );
                      return (
                        <div
                          key={idx}
                          className="p-2.5 border rounded-md text-sm flex flex-col sm:flex-row justify-between sm:items-center bg-white hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1 sm:mb-0">
                            <Badge variant="outline" className="font-mono">
                              #{stat.jerseyNumber}
                            </Badge>
                            <span className="font-medium text-gray-800">
                              {stat.name}
                            </span>
                            <span className="text-gray-500 text-xs">
                              (Out by: {stat.outBy || "N/A"})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-end sm:justify-start">
                            <Badge
                              variant="secondary"
                              title={symbolInfo?.name}
                              className="w-8 h-6 p-0 flex items-center justify-center font-bold"
                            >
                              {symbolInfo?.abbr || "?"}
                            </Badge>
                            <span
                              className="font-mono text-blue-600 text-xs w-[45px] text-right"
                              title="Per Time"
                            >
                              {formatTime(stat.perTime)}
                            </span>
                            <span
                              className="font-mono text-gray-400 text-xs w-[45px] text-right"
                              title="Run Time"
                            >
                              ({formatTime(stat.runTime)})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attacker Log */}
            <Card className="shadow-sm border-t-4 border-red-500">
              <CardHeader className="bg-red-50 border-b py-3 px-4">
                <CardTitle className="text-base text-red-800 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Attacker Actions ({currentTurnData.attackingTeam.name})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-4 pb-4">
                {currentTurnData.attackerStats.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">
                    No attacker points scored this turn.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentTurnData.attackerStats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 border rounded-md text-sm flex flex-col sm:flex-row justify-between sm:items-center bg-white hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1 sm:mb-0">
                          <Badge
                            variant="outline"
                            className="font-mono bg-red-50 border-red-200 text-red-800"
                          >
                            #{stat.jerseyNumber}
                          </Badge>
                          <span className="font-medium text-gray-800">
                            {stat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 justify-end sm:justify-start">
                          <Badge className="bg-green-600 min-w-[50px] justify-center">
                            {stat.points} pts
                          </Badge>
                          {stat.defendersOut.length > 0 && (
                            <span className="text-xs text-gray-500">
                              ({stat.defendersOut.length} out)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Log */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-100 border-b py-3 px-4">
              <CardTitle className="text-base text-gray-700 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Detailed Action Log (Turn {currentTurnData.turnNumber})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4 pb-4">
              {currentTurnData.turnActions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No actions recorded in this turn.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Run Time</TableHead>
                        <TableHead className="w-[50px]">Symbol</TableHead>
                        <TableHead>Action Details</TableHead>
                        <TableHead className="w-[80px] text-right">
                          Points
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentTurnData.turnActions.map((action, idx) => {
                        const symbolInfo = SYMBOLS.find(
                          (s) => s.type === getStringValue(action, "symbol")
                        );
                        const actionDetail = [
                          getStringValue(action, "attackerName") &&
                            `A#${getNumValue(action, "attackerJersey")}`,
                          getStringValue(action, "defenderName") &&
                            `D#${getNumValue(action, "defenderJersey")}`,
                        ]
                          .filter(Boolean)
                          .join(" → ");
                        const points = getNumValue(action, "points");
                        return (
                          <TableRow key={(action as any).id || idx}>
                            <TableCell className="font-mono text-gray-600">
                              {formatTime(getNumValue(action, "runTime"))}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                title={symbolInfo?.name}
                                className="w-8 h-6 p-0 flex items-center justify-center font-bold text-xs"
                              >
                                {symbolInfo?.abbr || "?"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {actionDetail || symbolInfo?.name || "Action"}
                            </TableCell>
                            <TableCell className="text-right">
                              {points > 0 && (
                                <Badge className="bg-green-600">
                                  +{points}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Optional: Render a message or skeleton if currentTurnData is null but not loading/error
        !loading &&
        !error && (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Select a valid turn to view details.
            </CardContent>
          </Card>
        )
      )}
      {/* --- END OF CHECK --- */}
      {/* Navigation */}
      <div className="flex justify-between items-center mt-6 sticky bottom-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md border">
        <Button
          onClick={goToPreviousTurn}
          disabled={currentTurnNumber <= 1}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Prev Turn
        </Button>
        <span className="text-sm font-medium text-gray-700">
          Turn {currentTurnNumber} / {totalTurns}
        </span>
        <Button
          onClick={goToNextTurn}
          variant="outline"
          disabled={currentTurnNumber > totalTurns}
        >
          {currentTurnNumber === totalTurns ? "View Summary" : "Next Turn"}
          {currentTurnNumber < totalTurns && (
            <ArrowRight className="w-4 h-4 ml-2" />
          )}
          {currentTurnNumber === totalTurns && (
            <Trophy className="w-4 h-4 ml-2" />
          )}
        </Button>
      </div>
      {/* Consolidated Report Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
          {/* Render ConsolidatedReport only when setupData is available */}
          {reconstructedSetupData && match && (
            <ConsolidatedReport
              match={match}
              setupData={reconstructedSetupData}
              actions={actions as ScoringAction[]} // Cast might be needed
              onClose={() => setShowSummaryModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
