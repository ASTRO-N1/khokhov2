import { useState, useEffect, useCallback, useMemo } from "react";
// FIX: Re-added CardHeader and CardTitle imports for player selection cards
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { RefreshCw } from "lucide-react";
import { Match, Player, ScoringAction, SymbolType } from "../../types";
import { MatchSetupData } from "./MatchSetupEnhanced";
import { toast } from "sonner";
import { ConsolidatedReport } from "./ConsolidatedReport";
import { EditActionsPage } from "./EditActionsPage";
import { supabase } from "../../supabaseClient";
// --- NEW IMPORTS ---
import { Scoreboard } from "./Scoreboard";
import { Scoresheet } from "./Scoresheet";

interface LiveScoringV4Props {
  match: Match;
  setupData: MatchSetupData;
  onBack: () => void;
  onEndMatch: (actions: ScoringAction[]) => void;
}

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

// Define a type for the action objects fetched from Supabase
type DbScoringAction = {
  id: string;
  created_at: string;
  match_id: string;
  inning: number;
  turn: number;
  scoring_team_id: string;
  defender_jersey: number | null;
  defender_name: string | null;
  attacker_jersey: number | null;
  attacker_name: string | null;
  symbol: SymbolType;
  action_type: string;
  points: number;
  run_time: number;
  per_time: number;
  user_id: string;
};

export function LiveScoringV4({
  match,
  setupData,
  onBack,
  onEndMatch,
}: LiveScoringV4Props) {
  const [currentInning, setCurrentInning] = useState(1);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [maxTimerDuration] = useState(setupData.timerDuration);

  const [selectedDefender, setSelectedDefender] = useState<Player | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<Player | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType | null>(null);
  const [substituteMode, setSubstituteMode] = useState(false);
  const [attackerToSwap, setAttackerToSwap] = useState<Player | null>(null);
  const [actions, setActions] = useState<DbScoringAction[]>([]);
  const [showConsolidatedReport, setShowConsolidatedReport] = useState(false);
  const [isFinalReport, setIsFinalReport] = useState(false);
  const [showEditActions, setShowEditActions] = useState(false);
  const [showEndMatchConfirm, setShowEndMatchConfirm] = useState(false);
  const [showCardConfirm, setShowCardConfirm] = useState(false);
  const [pendingCardAction, setPendingCardAction] = useState<{
    symbol: SymbolType;
    player: Player | null;
    isDefender: boolean;
  } | null>(null);
  // Removed explicit useState for defendersOut.
  const [userId, setUserId] = useState<string | null>(null);

  const [currentDefendingTeam, setCurrentDefendingTeam] = useState<"A" | "B">(
    (setupData.tossWinner === "A" && setupData.tossDecision === "defend") ||
      (setupData.tossWinner === "B" && setupData.tossDecision === "attack")
      ? "A"
      : "B"
  );

  const [teamAPlaying, setTeamAPlaying] = useState<Player[]>(
    setupData.teamAPlaying
  );
  const [teamASubstitutes, setTeamASubstitutes] = useState<Player[]>(
    setupData.teamASubstitutes
  );
  const [teamBPlaying, setTeamBPlaying] = useState<Player[]>(
    setupData.teamBPlaying
  );
  const [teamBSubstitutes, setTeamBSubstitutes] = useState<Player[]>(
    setupData.teamBSubstitutes
  );

  const defenders = useMemo(
    () => (currentDefendingTeam === "A" ? teamAPlaying : teamBPlaying),
    [currentDefendingTeam, teamAPlaying, teamBPlaying]
  );
  const attackers = useMemo(
    () => (currentDefendingTeam === "A" ? teamBPlaying : teamAPlaying),
    [currentDefendingTeam, teamBPlaying, teamAPlaying]
  );
  const attackerSubstitutes = useMemo(
    () => (currentDefendingTeam === "A" ? teamBSubstitutes : teamASubstitutes),
    [currentDefendingTeam, teamBSubstitutes, teamASubstitutes]
  );

  // FIX: Derived state for defenders out
  const defendersOut = useMemo(() => {
    const currentTurnActions = actions.filter(
      (a) => a.inning === currentInning && a.turn === currentTurn
    );
    const outPlayerIds = new Set<string>();

    currentTurnActions.forEach((action) => {
      const defenderPlayer = defenders.find(
        (d) =>
          d.jerseyNumber === action.defender_jersey &&
          d.name === action.defender_name
      );
      if (defenderPlayer) outPlayerIds.add(defenderPlayer.id);
    });

    return outPlayerIds;
  }, [actions, currentInning, currentTurn, defenders]);

  useEffect(() => {
    const fetchUserAndActions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data, error } = await supabase
        .from("scoring_actions")
        .select("*")
        .eq("match_id", match.id)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to fetch initial scoring data: " + error.message);
      } else if (data) {
        setActions(data as DbScoringAction[]);
      }
    };

    fetchUserAndActions();

    const channel = supabase
      .channel(`scoring_actions:${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scoring_actions",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setActions((currentActions) => [
              ...currentActions,
              payload.new as DbScoringAction,
            ]);
          } else if (payload.eventType === "DELETE") {
            setActions((currentActions) =>
              currentActions.filter(
                (action) => action.id !== (payload.old as DbScoringAction).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer < maxTimerDuration) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxTimerDuration) {
            setIsTimerRunning(false);
            toast.warning("⏰ Turn Over! Time limit reached", {
              duration: 3000,
            });
            return maxTimerDuration;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer, maxTimerDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleToggleTimer = useCallback((run: boolean) => {
    setIsTimerRunning(run);
  }, []);

  const handleDefenderSelect = (defender: Player) => {
    setSelectedDefender(defender);
    // Do not reset attacker, allow for quick multi-outs by same attacker
    setSelectedSymbol(null);
    setSubstituteMode(false);
    setAttackerToSwap(null);
  };

  const handleAttackerSelect = (attacker: Player) => {
    setSelectedAttacker(attacker);
    setSelectedSymbol(null);
  };

  const handleSymbolSelect = (symbol: SymbolType) => {
    const symbolData = SYMBOLS.find((s) => s.type === symbol);
    if (symbolData?.singlePlayer) {
      if (!selectedDefender && !selectedAttacker) {
        toast.error("Please select either a defender or an attacker");
        return;
      }
    } else {
      if (!selectedDefender) {
        toast.error("Please select a defender first");
        return;
      }
      if (!selectedAttacker) {
        toast.error("Please select an attacker");
        return;
      }
    }
    setSelectedSymbol(symbol);
  };

  const handleSubstituteClick = () => {
    if (!selectedAttacker) {
      toast.error("Please select a playing attacker to substitute");
      return;
    }
    setSubstituteMode(true);
    setAttackerToSwap(selectedAttacker);
    toast.info(
      `Select a substitute player to swap with ${selectedAttacker.name}`
    );
  };

  const handleSubstituteSelect = (substitute: Player) => {
    if (!attackerToSwap) return;

    if (currentDefendingTeam === "A") {
      const newPlaying = teamBPlaying.filter((p) => p.id !== attackerToSwap.id);
      newPlaying.push(substitute);
      const newSubstitutes = teamBSubstitutes.filter(
        (p) => p.id !== substitute.id
      );
      newSubstitutes.push(attackerToSwap);
      setTeamBPlaying(newPlaying);
      setTeamBSubstitutes(newSubstitutes);
    } else {
      const newPlaying = teamAPlaying.filter((p) => p.id !== attackerToSwap.id);
      newPlaying.push(substitute);
      const newSubstitutes = teamASubstitutes.filter(
        (p) => p.id !== substitute.id
      );
      newSubstitutes.push(attackerToSwap);
      setTeamAPlaying(newPlaying);
      setTeamASubstitutes(newSubstitutes);
    }

    toast.success(`Swapped ${attackerToSwap.name} with ${substitute.name}`);
    setSelectedAttacker(substitute);
    setSubstituteMode(false);
    setAttackerToSwap(null);
  };

  const handleOut = () => {
    if (selectedSymbol === "yellow-card" || selectedSymbol === "red-card") {
      setPendingCardAction({
        symbol: selectedSymbol,
        player: selectedDefender || selectedAttacker,
        isDefender: !!selectedDefender,
      });
      setShowCardConfirm(true);
      return;
    }
    confirmOut();
  };

  const confirmOut = async () => {
    const symbolData = SYMBOLS.find((s) => s.type === selectedSymbol);
    if (!symbolData) return;

    if (symbolData.singlePlayer) {
      if ((!selectedDefender && !selectedAttacker) || !selectedSymbol) {
        toast.error("Please select a player and a symbol for this action.");
        return;
      }
    } else {
      if (!selectedDefender || !selectedAttacker || !selectedSymbol) {
        toast.error(
          "Please select Defender → Attacker → Symbol before confirming."
        );
        return;
      }
    }

    const currentTurnActions = actions.filter(
      (a) => a.inning === currentInning && a.turn === currentTurn
    );
    const lastActionTime =
      currentTurnActions.length > 0
        ? currentTurnActions[currentTurnActions.length - 1].run_time
        : 0;
    const perTime = timer - lastActionTime;

    const scoring_team_id =
      currentDefendingTeam === "A" ? match.teamB.id : match.teamA.id;

    const newActionData = {
      match_id: match.id,
      inning: currentInning,
      turn: currentTurn,
      scoring_team_id,
      defender_jersey: selectedDefender?.jerseyNumber || null,
      defender_name: selectedDefender?.name || null,
      attacker_jersey: selectedAttacker?.jerseyNumber || null,
      attacker_name: selectedAttacker?.name || null,
      symbol: selectedSymbol,
      action_type: "out",
      points: symbolData.points,
      run_time: timer,
      per_time: perTime,
      user_id: userId,
    };

    const { error } = await supabase
      .from("scoring_actions")
      .insert([newActionData]);

    if (error) {
      toast.error("Failed to save action: " + error.message);
    } else {
      if (selectedDefender) {
        // Check if all defenders are now out using the DERIVED state size
        // We use .size + 1 because the current action hasn't yet updated the `actions` state
        if (defendersOut.size + 1 >= defenders.length) {
          toast.info("All defenders are out! Starting next batch.");
        }
      }

      setSelectedDefender(null);
      setSelectedSymbol(null);
    }
  };

  const confirmCardAction = () => {
    setShowCardConfirm(false);
    confirmOut();
    setPendingCardAction(null);
  };

  const handleUndoLastAction = async () => {
    if (actions.length === 0) {
      toast.error("No actions to undo.");
      return;
    }

    const lastAction = actions[actions.length - 1];

    const { error } = await supabase
      .from("scoring_actions")
      .delete()
      .eq("id", lastAction.id); // Use the action's ID for precise deletion

    if (error) {
      toast.error(`Failed to undo last action: ${error.message}`);
    } else {
      // We rely entirely on the Supabase listener to remove the action from the 'actions' state.
      // All derived states (scores, defendersOut) update automatically.
      toast.success("Last action has been successfully undone.");
    }
  };

  const scores = useMemo(() => {
    const teamAId = match.teamA.id;
    const teamBId = match.teamB.id;

    const teamAScore = actions
      .filter((a) => a.scoring_team_id === teamAId)
      .reduce((sum, a) => sum + a.points, 0);
    const teamBScore = actions
      .filter((a) => a.scoring_team_id === teamBId)
      .reduce((sum, a) => sum + a.points, 0);

    return { teamA: teamAScore, teamB: teamBScore };
  }, [actions, match.teamA.id, match.teamB.id]);

  const handleNextTurn = () => {
    if (confirm(`End Turn ${currentTurn} and start Turn ${currentTurn + 1}?`)) {
      const newTurn = currentTurn + 1;
      let newInning = currentInning;

      if (newTurn > 2 && newTurn % 2 === 1) {
        newInning = currentInning + 1;
        setCurrentInning(newInning);
        toast.success(
          `Inning ${currentInning} Over! Starting Inning ${newInning}, Turn ${newTurn}.`
        );
      } else {
        toast.success(`Turn ${newTurn} started.`);
      }

      setCurrentTurn(newTurn);
      setTimer(0);
      setIsTimerRunning(false);
      // Removed setDefendersOut as it is now derived.
      setCurrentDefendingTeam(currentDefendingTeam === "A" ? "B" : "A");
      setSelectedDefender(null);
      setSelectedAttacker(null);
      setSelectedSymbol(null);
    }
  };

  const handleEndMatch = () => {
    if (currentTurn < 2 && currentInning === 1) {
      toast.error(
        "At least one full inning (2 turns) must be completed before ending the match."
      );
      return;
    }
    setShowEndMatchConfirm(true);
  };

  // FIX: Logic changed to show report, then end match on report close
  const confirmEndMatch = () => {
    setIsTimerRunning(false);
    setShowEndMatchConfirm(false);
    setIsFinalReport(true); // <-- SET FLAG TO TRUE
    setShowConsolidatedReport(true);
  };

  const handleCloseReport = () => {
    setShowConsolidatedReport(false);
    setIsFinalReport(false);
  };

  const handleCloseReportAndFinish = () => {
    setShowConsolidatedReport(false);
    setIsFinalReport(false); // Reset state
    onEndMatch(actions as unknown as ScoringAction[]);
  };

  const defenderScoresheet = useMemo(
    () =>
      actions
        .filter((a) => a.inning === currentInning && a.turn === currentTurn)
        .map((action) => ({
          jerseyNumber: action.defender_jersey,
          name: action.defender_name,
          perTime: action.per_time,
          runTime: action.run_time,
          outBy: action.attacker_name,
          symbol: action.symbol,
        })),
    [actions, currentInning, currentTurn]
  );

  const attackerScoresheet = useMemo(() => {
    const sheet: {
      [key: number]: { name: string; points: number; defendersOut: string[] };
    } = {};
    actions
      .filter((a) => a.inning === currentInning && a.turn === currentTurn)
      .forEach((action) => {
        if (!action.attacker_jersey) return;
        if (!sheet[action.attacker_jersey]) {
          sheet[action.attacker_jersey] = {
            name: action.attacker_name || "N/A",
            points: 0,
            defendersOut: [],
          };
        }
        sheet[action.attacker_jersey].points += action.points;
        if (action.defender_name) {
          sheet[action.attacker_jersey].defendersOut.push(action.defender_name);
        }
      });
    return sheet;
  }, [actions, currentInning, currentTurn]);

  return (
    <>
      {/* AlertDialogs for End Match and Cards */}
      <AlertDialog
        open={showEndMatchConfirm}
        onOpenChange={setShowEndMatchConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Match</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end the match? This will finalize the
              scores and show the final report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEndMatch}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, End Match & View Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCardConfirm} onOpenChange={setShowCardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingCardAction?.symbol === "yellow-card"
                ? "Yellow Card"
                : "Red Card"}{" "}
              Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to issue a{" "}
              {pendingCardAction?.symbol === "yellow-card"
                ? "Yellow Card"
                : "Red Card"}{" "}
              to <strong>{pendingCardAction?.player?.name}</strong> (#
              {pendingCardAction?.player?.jerseyNumber})?
              {pendingCardAction?.symbol === "red-card" &&
                " This is a serious penalty."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCardAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCardAction}
              className={
                pendingCardAction?.symbol === "yellow-card"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              Confirm{" "}
              {pendingCardAction?.symbol === "yellow-card"
                ? "Yellow Card"
                : "Red Card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Consolidated Report and Edit Actions Modals */}
      {showConsolidatedReport && (
        <ConsolidatedReport
          match={match}
          setupData={setupData}
          actions={actions as unknown as ScoringAction[]}
          // FIX: Pass the correct handler based on the flag
          onClose={
            isFinalReport ? handleCloseReportAndFinish : handleCloseReport
          }
        />
      )}
      {showEditActions && (
        <EditActionsPage
          actions={actions as unknown as ScoringAction[]}
          allDefenders={defenders}
          allAttackers={attackers}
          onSave={() => {}}
          onClose={() => setShowEditActions(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header - Replaced with Scoreboard Component */}
        <Scoreboard
          match={match}
          scores={scores}
          timer={timer}
          maxTimerDuration={maxTimerDuration}
          isTimerRunning={isTimerRunning}
          currentInning={currentInning}
          currentTurn={currentTurn}
          onToggleTimer={handleToggleTimer}
          onUndo={handleUndoLastAction}
          onNextTurn={handleNextTurn}
          onEndMatch={handleEndMatch}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 space-y-4">
          {substituteMode && attackerToSwap && (
            <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-3 shadow-sm">
              <p className="text-sm text-yellow-900">
                <strong>Substitution Mode:</strong> Select a substitute player
                to replace <strong>{attackerToSwap.name}</strong>
              </p>
            </div>
          )}

          {!substituteMode && (
            <Card className="border border-blue-200 bg-blue-50 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          selectedDefender
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-300"
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        <strong>D:</strong>{" "}
                        {selectedDefender
                          ? selectedDefender.name
                          : "Not selected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          selectedAttacker
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-300"
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        <strong>A:</strong>{" "}
                        {selectedAttacker
                          ? selectedAttacker.name
                          : "Not selected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          selectedSymbol
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-300"
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        <strong>S:</strong>{" "}
                        {selectedSymbol
                          ? SYMBOLS.find((s) => s.type === selectedSymbol)?.name
                          : "Not selected"}
                      </span>
                    </div>
                  </div>
                  {selectedSymbol &&
                    SYMBOLS.find((s) => s.type === selectedSymbol)
                      ?.singlePlayer && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 border-yellow-400 text-yellow-800"
                      >
                        Single Player Symbol
                      </Badge>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border border-gray-300 shadow-sm">
              <CardHeader className="border-b bg-blue-50 py-2">
                <CardTitle className="text-sm text-blue-900">
                  Defenders
                </CardTitle>
                <p className="text-xs text-blue-700 mt-0.5">
                  {currentDefendingTeam === "A"
                    ? match.teamA.name
                    : match.teamB.name}
                </p>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {defenders.map((player) => {
                    const isOut = defendersOut.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => !isOut && handleDefenderSelect(player)}
                        disabled={substituteMode || isOut}
                        className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                          isOut
                            ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                            : selectedDefender?.id === player.id
                            ? "border-blue-600 bg-blue-100 shadow-md hover:scale-105"
                            : substituteMode
                            ? "border-gray-300 opacity-50 cursor-not-allowed"
                            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:scale-105"
                        }`}
                      >
                        <div className="text-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-1 ${
                              isOut
                                ? "bg-gray-400 text-gray-200"
                                : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                            }`}
                          >
                            {player.jerseyNumber}
                          </div>
                          <p
                            className={`text-[10px] truncate leading-tight ${
                              isOut ? "text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {player.name}
                          </p>
                          {isOut && (
                            <p className="text-[8px] text-red-500 mt-0.5">
                              OUT
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-300 shadow-sm">
              <CardHeader className="border-b bg-red-50 py-2">
                <CardTitle className="text-sm text-red-900">
                  Attackers
                </CardTitle>
                <p className="text-xs text-red-700 mt-0.5">
                  {currentDefendingTeam === "A"
                    ? match.teamB.name
                    : match.teamA.name}
                </p>
              </CardHeader>
              <CardContent className="p-3">
                {!substituteMode ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {attackers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handleAttackerSelect(player)}
                          className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                            selectedAttacker?.id === player.id
                              ? "border-red-600 bg-red-100 shadow-md"
                              : "border-gray-300 hover:border-red-400 hover:bg-gray-50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white mx-auto mb-1">
                              {player.jerseyNumber}
                            </div>
                            <p className="text-[10px] text-gray-900 truncate leading-tight">
                              {player.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handleSubstituteClick}
                      disabled={!selectedAttacker}
                      variant="outline"
                      size="sm"
                      className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 transition-all"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Substitute
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 mb-2">
                      Select substitute:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {attackerSubstitutes.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handleSubstituteSelect(player)}
                          className="p-2 rounded-lg border-2 border-green-400 hover:border-green-600 hover:bg-green-50 transition-all duration-200 hover:scale-105"
                        >
                          <div className="text-center">
                            <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white mx-auto mb-1">
                              {player.jerseyNumber}
                            </div>
                            <p className="text-[10px] text-gray-900 truncate leading-tight">
                              {player.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() => {
                        setSubstituteMode(false);
                        setAttackerToSwap(null);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-300 shadow-sm">
              <CardHeader className="border-b bg-gray-50 py-2">
                <CardTitle className="text-sm text-gray-900">Symbols</CardTitle>
                <p className="text-xs text-gray-600 mt-0.5">Type of out</p>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {SYMBOLS.map((symbol) => (
                    <button
                      key={symbol.type}
                      onClick={() =>
                        handleSymbolSelect(symbol.type as SymbolType)
                      }
                      disabled={
                        substituteMode ||
                        (!symbol.singlePlayer &&
                          (!selectedDefender || !selectedAttacker)) ||
                        (symbol.singlePlayer &&
                          !selectedDefender &&
                          !selectedAttacker)
                      }
                      className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                        selectedSymbol === symbol.type
                          ? "border-indigo-600 bg-indigo-100 shadow-md"
                          : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                      } ${
                        substituteMode ||
                        (!symbol.singlePlayer &&
                          (!selectedDefender || !selectedAttacker)) ||
                        (symbol.singlePlayer &&
                          !selectedDefender &&
                          !selectedAttacker)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-xs leading-tight font-medium text-gray-900">
                          {symbol.name}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          ({symbol.abbr}){symbol.singlePlayer ? " *" : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleOut}
                  disabled={
                    !selectedSymbol ||
                    (!SYMBOLS.find((s) => s.type === selectedSymbol)
                      ?.singlePlayer &&
                      (!selectedDefender || !selectedAttacker))
                  }
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 shadow-lg transition-all"
                >
                  Confirm
                </Button>
                {SYMBOLS.some((s) => s.singlePlayer) && (
                  <p className="text-[10px] text-gray-500 text-center mt-1">
                    * Single player symbols (only defender or attacker needed)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Scoresheet Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Scoresheet</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    document
                      .getElementById("defender-scoresheet")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  View Defender Scoresheet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    document
                      .getElementById("attacker-scoresheet")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  View Attacker Scoresheet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  onClick={() => {
                    setIsFinalReport(false);
                    setShowConsolidatedReport(true);
                  }}
                >
                  View Consolidated Report
                </Button>
              </div>
            </div>

            <Scoresheet
              inning={currentInning}
              turn={currentTurn}
              defenderScoresheet={defenderScoresheet}
              attackerScoresheet={attackerScoresheet}
              onViewConsolidatedReport={() => setShowConsolidatedReport(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
