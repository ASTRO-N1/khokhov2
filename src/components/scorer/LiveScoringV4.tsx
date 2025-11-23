import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { RefreshCw, Ban, Users, Check, RotateCcw, History } from "lucide-react";
import { Match, Player, ScoringAction, SymbolType } from "../../types";
import { MatchSetupData } from "./MatchSetupEnhanced";
import { toast } from "sonner";
import { ConsolidatedReport } from "./ConsolidatedReport";
import { EditActionsPage } from "./EditActionsPage";
import { supabase } from "../../supabaseClient";
import { Scoreboard } from "./Scoreboard";
import { Scoresheet } from "./Scoresheet";
import { BatchSelectionModal } from "./BatchSelectionModal";
import { cn } from "../ui/utils";

const TURN_BREAK_DURATION = 180;
const INNING_BREAK_DURATION = 300;
const BATCH_SIZE = 3;
const TOTAL_BATCHES = 3;

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

// --- Helper Functions ---

const getStringValue = (action: any, key: string): string | null => {
  const val =
    action[key] ||
    action[key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()];
  return typeof val === "string" && val ? val : null;
};

const getNumValue = (action: any, key: string): number => {
  const val =
    action[key] !== undefined
      ? action[key]
      : action[key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()];
  return typeof val === "number" ? val : parseInt(val) || 0;
};

// --- Sticky State Hook for Persistence ---
function useStickyState<T>(
  defaultValue: T,
  key: string
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

export function LiveScoringV4({
  match,
  setupData,
  onBack,
  onEndMatch,
}: LiveScoringV4Props) {
  // --- Persistent Game State ---
  const [currentInning, setCurrentInning] = useStickyState(
    1,
    `match_${match.id}_inning`
  );
  const [currentTurn, setCurrentTurn] = useStickyState(
    1,
    `match_${match.id}_turn`
  );

  // Timer State (Persistent)
  const [timer, setTimer] = useStickyState(0, `match_${match.id}_timer`);
  const [isTimerRunning, setIsTimerRunning] = useStickyState(
    false,
    `match_${match.id}_is_running`
  );
  const [lastTick, setLastTick] = useStickyState(
    Date.now(),
    `match_${match.id}_last_tick`
  );
  const [maxTimerDuration] = useState(setupData.timerDuration || 540);

  // Break State (Persistent)
  const [isOnBreak, setIsOnBreak] = useStickyState(
    false,
    `match_${match.id}_on_break`
  );
  const [breakTimer, setBreakTimer] = useStickyState(
    0,
    `match_${match.id}_break_timer`
  );
  const [breakType, setBreakType] = useStickyState<"turn" | "inning" | null>(
    null,
    `match_${match.id}_break_type`
  );

  // Team & Player State (Persistent to handle reloads during subs)
  const [teamAPlaying, setTeamAPlaying] = useStickyState<Player[]>(
    setupData.teamAPlaying,
    `match_${match.id}_teamA_playing`
  );
  const [teamASubstitutes, setTeamASubstitutes] = useStickyState<Player[]>(
    setupData.teamASubstitutes,
    `match_${match.id}_teamA_subs`
  );
  const [teamBPlaying, setTeamBPlaying] = useStickyState<Player[]>(
    setupData.teamBPlaying,
    `match_${match.id}_teamB_playing`
  );
  const [teamBSubstitutes, setTeamBSubstitutes] = useStickyState<Player[]>(
    setupData.teamBSubstitutes,
    `match_${match.id}_teamB_subs`
  );

  const [currentDefendingTeam, setCurrentDefendingTeam] = useStickyState<
    "A" | "B"
  >(
    (setupData.tossWinner === "A" && setupData.tossDecision === "defend") ||
      (setupData.tossWinner === "B" && setupData.tossDecision === "attack")
      ? "A"
      : "B",
    `match_${match.id}_defending_team`
  );

  // Batch State (Persistent)
  const [defenderBatches, setDefenderBatches] = useStickyState<Player[][]>(
    [],
    `match_${match.id}_active_batches`
  );
  const [activeBatchIndex, setActiveBatchIndex] = useStickyState(
    0,
    `match_${match.id}_active_batch_idx`
  );
  const [batchesConfirmed, setBatchesConfirmed] = useStickyState(
    false,
    `match_${match.id}_batches_confirmed`
  );
  const [batchCycleCount, setBatchCycleCount] = useStickyState(
    0,
    `match_${match.id}_batch_cycle`
  );
  const [savedBatchesA, setSavedBatchesA] = useStickyState<Player[][] | null>(
    null,
    `match_${match.id}_saved_batches_A`
  );
  const [savedBatchesB, setSavedBatchesB] = useStickyState<Player[][] | null>(
    null,
    `match_${match.id}_saved_batches_B`
  );

  // --- Transient UI State (Resets on reload) ---
  const [showDefenderSubModal, setShowDefenderSubModal] = useState(false);
  const [defenderToSwapOut, setDefenderToSwapOut] = useState<Player | null>(
    null
  );
  const [teamADefenderSubUsed, setTeamADefenderSubUsed] = useState<{
    [inning: number]: boolean;
  }>({});
  const [teamBDefenderSubUsed, setTeamBDefenderSubUsed] = useState<{
    [inning: number]: boolean;
  }>({});

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

  const [userId, setUserId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const activeBatchIndexRef = useRef(activeBatchIndex);

  // --- Computed Properties ---
  const allPlayingDefenders = useMemo(
    () => (currentDefendingTeam === "A" ? teamAPlaying : teamBPlaying),
    [currentDefendingTeam, teamAPlaying, teamBPlaying]
  );

  const activeDefenders = useMemo(() => {
    if (!batchesConfirmed || !defenderBatches[activeBatchIndex]) {
      return [];
    }
    return defenderBatches[activeBatchIndex];
  }, [batchesConfirmed, defenderBatches, activeBatchIndex]);

  const attackers = useMemo(
    () => (currentDefendingTeam === "A" ? teamBPlaying : teamAPlaying),
    [currentDefendingTeam, teamBPlaying, teamAPlaying]
  );

  const attackerSubstitutes = useMemo(
    () => (currentDefendingTeam === "A" ? teamBSubstitutes : teamASubstitutes),
    [currentDefendingTeam, teamBSubstitutes, teamASubstitutes]
  );

  const defenderSubstitutes = useMemo(
    () => (currentDefendingTeam === "A" ? teamASubstitutes : teamBSubstitutes),
    [currentDefendingTeam, teamASubstitutes, teamBSubstitutes]
  );

  const scores = useMemo(() => {
    const teamAId = match.teamA.id;
    const teamBId = match.teamB.id;
    const teamAScore = actions
      .filter((a) => a.scoring_team_id === teamAId)
      .reduce((sum, a) => sum + (a.points || 0), 0);
    const teamBScore = actions
      .filter((a) => a.scoring_team_id === teamBId)
      .reduce((sum, a) => sum + (a.points || 0), 0);
    return { teamA: teamAScore, teamB: teamBScore };
  }, [actions, match.teamA.id, match.teamB.id]);

  // --- Batch Logic ---
  const defendersOutIdsInActiveBatch = useMemo(() => {
    const outIds = new Set<string>();
    if (!batchesConfirmed || !defenderBatches[activeBatchIndex]) {
      return outIds;
    }

    const activeBatchPlayerIds = new Set(
      defenderBatches[activeBatchIndex].map((p) => p.id)
    );
    const currentTurnActions = actions.filter(
      (a) =>
        a.inning === currentInning &&
        a.turn === currentTurn &&
        getStringValue(a, "defenderName")
    );

    const startIndex =
      (batchCycleCount * TOTAL_BATCHES + activeBatchIndex) * BATCH_SIZE;
    const actionsForCurrentBatchActivation =
      currentTurnActions.slice(startIndex);

    actionsForCurrentBatchActivation.forEach((action) => {
      const defenderPlayer = allPlayingDefenders.find(
        (d) =>
          d.jerseyNumber === getNumValue(action, "defenderJersey") &&
          d.name === getStringValue(action, "defenderName")
      );

      if (defenderPlayer && activeBatchPlayerIds.has(defenderPlayer.id)) {
        outIds.add(defenderPlayer.id);
      }
    });

    return outIds;
  }, [
    actions,
    currentInning,
    currentTurn,
    batchesConfirmed,
    defenderBatches,
    activeBatchIndex,
    batchCycleCount,
    allPlayingDefenders,
  ]);

  useEffect(() => {
    if (!batchesConfirmed || defenderBatches.length === 0) return;

    const currentActiveIndex = activeBatchIndexRef.current;
    const activeBatch = defenderBatches[currentActiveIndex];
    if (!activeBatch || activeBatch.length === 0) return;

    const allActiveOut = activeBatch.every((player) =>
      defendersOutIdsInActiveBatch.has(player.id)
    );

    if (allActiveOut) {
      const nextBatchIndex = (currentActiveIndex + 1) % TOTAL_BATCHES;
      if (nextBatchIndex === 0) {
        setBatchCycleCount((prev) => prev + 1);
      }
      setActiveBatchIndex(nextBatchIndex);
      setSelectedDefender(null);
      toast.info(
        `Batch ${currentActiveIndex + 1} cleared! Batch ${
          nextBatchIndex + 1
        } is now active.`
      );
    }
  }, [
    defendersOutIdsInActiveBatch,
    batchesConfirmed,
    defenderBatches,
    setActiveBatchIndex,
    setBatchCycleCount,
  ]);

  useEffect(() => {
    activeBatchIndexRef.current = activeBatchIndex;
  }, [activeBatchIndex]);

  // --- Initial Data Fetch ---
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
            setActions((currentActions) => {
              if (
                currentActions.some(
                  (a) => a.id === (payload.new as DbScoringAction).id
                )
              ) {
                return currentActions;
              }
              return [...currentActions, payload.new as DbScoringAction];
            });
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

  // --- SYNC HELPERS ---
  const syncTimerToDb = async (
    newTimerValue: number,
    status: "running" | "paused" | "break" | "stopped"
  ) => {
    try {
      await supabase
        .from("matches")
        .update({
          timer_value: newTimerValue,
          timer_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", match.id);
    } catch (err) {
      console.error("Timer sync failed", err);
    }
  };

  const updateMatchStatusToFinished = async () => {
    // Calculate final scores locally to ensure accuracy
    const teamAId = match.teamA.id;
    const teamBId = match.teamB.id;
    const finalScoreA = actions
      .filter((a) => a.scoring_team_id === teamAId)
      .reduce((sum, a) => sum + (a.points || 0), 0);
    const finalScoreB = actions
      .filter((a) => a.scoring_team_id === teamBId)
      .reduce((sum, a) => sum + (a.points || 0), 0);

    await supabase
      .from("matches")
      .update({
        status: "finished",
        score_a: finalScoreA,
        score_b: finalScoreB,
        timer_status: "stopped",
      })
      .eq("id", match.id);
  };

  // --- Turn Management ---
  const startNextTurnActual = useCallback(async () => {
    setIsOnBreak(false);
    setBreakTimer(0);
    setBreakType(null);

    const newTurn = currentTurn + 1;
    let newInning = currentInning;

    if (currentTurn % 2 === 0) {
      newInning = currentInning + 1;
      setCurrentInning(newInning);
    }

    const totalTurnsToPlay = (match.innings || 2) * 2;
    if (newTurn > totalTurnsToPlay) {
      toast.success(`Match Finished!`);
      setShowEndMatchConfirm(true);
      return;
    }

    // UPDATE DB WITH NEW TURN INFO & RESET TIMER STATUS
    await supabase
      .from("matches")
      .update({
        current_inning: newInning,
        current_turn: newTurn,
        timer_status: "stopped", // Reset to stopped for the new turn
        timer_value: 0,
        status: "live",
      })
      .eq("id", match.id);

    setCurrentTurn(newTurn);
    setTimer(0);
    setIsTimerRunning(false);

    // Switch sides
    const nextDefendingTeam = currentDefendingTeam === "A" ? "B" : "A";
    setCurrentDefendingTeam(nextDefendingTeam);

    // Reset local transient state
    setSelectedDefender(null);
    setSelectedAttacker(null);
    setSelectedSymbol(null);
    setBatchesConfirmed(false); // Force batch selection for new turn
    setDefenderBatches([]);
    setActiveBatchIndex(0);
    setBatchCycleCount(0);

    // Save current batches to "Previous" cache before clearing
    if (currentDefendingTeam === "A") {
      setSavedBatchesA(defenderBatches);
    } else {
      setSavedBatchesB(defenderBatches);
    }

    toast.success(
      newInning > currentInning
        ? `Starting Inning ${newInning}, Turn ${newTurn}`
        : `Starting Turn ${newTurn}`
    );
  }, [
    currentTurn,
    currentInning,
    match.id,
    currentDefendingTeam,
    defenderBatches,
    match.innings,
    setBatchesConfirmed,
    setDefenderBatches,
    setActiveBatchIndex,
    setBatchCycleCount,
    setIsOnBreak,
    setBreakTimer,
    setBreakType,
    setCurrentInning,
    setCurrentTurn,
    setTimer,
    setIsTimerRunning,
    setCurrentDefendingTeam,
    setSavedBatchesA,
    setSavedBatchesB,
  ]);

  const handleNextTurn = useCallback(
    (autoTriggered = false) => {
      if (isOnBreak) {
        toast.info("Already in a break.");
        return;
      }
      const confirmMessage = autoTriggered
        ? `Turn ${currentTurn} ended due to time limit. Start the break?`
        : `End Turn ${currentTurn} and start the break?`;

      if (!autoTriggered && !confirm(confirmMessage)) {
        return;
      }

      setIsTimerRunning(false);
      let breakDuration = TURN_BREAK_DURATION;
      let nextBreakType: "turn" | "inning" = "turn";
      let toastMessage = `Turn ${currentTurn} finished. Starting ${formatTime(
        TURN_BREAK_DURATION
      )} break.`;

      if (currentTurn % 2 === 0) {
        breakDuration = INNING_BREAK_DURATION;
        nextBreakType = "inning";
        toastMessage = `Inning ${currentInning} finished. Starting ${formatTime(
          INNING_BREAK_DURATION
        )} break.`;
      }

      setBreakType(nextBreakType);
      setBreakTimer(breakDuration);
      setIsOnBreak(true);

      // SYNC BREAK STATUS TO DB
      syncTimerToDb(breakDuration, "break");

      toast.info(toastMessage);

      // Don't clear batches yet, wait for startNextTurnActual
    },
    [
      isOnBreak,
      currentTurn,
      currentInning,
      setIsTimerRunning,
      setBreakType,
      setBreakTimer,
      setIsOnBreak,
    ]
  );

  // --- Robust Timer Logic (Fixed) ---
  // 1. Pure Timer Update Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning && !isOnBreak) {
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTick) / 1000);

        if (delta >= 1) {
          setTimer((prev) => Math.min(prev + delta, maxTimerDuration));
          setLastTick(now);
        }
      }, 1000);
    } else {
      setLastTick(Date.now());
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isTimerRunning,
    isOnBreak,
    lastTick,
    maxTimerDuration,
    setTimer,
    setLastTick,
  ]);

  // 2. Timer Limit Watcher
  useEffect(() => {
    if (timer >= maxTimerDuration && isTimerRunning) {
      setIsTimerRunning(false);
      syncTimerToDb(maxTimerDuration, "paused"); // Stop timer in DB
      toast.warning("⏰ Turn Over! Time limit reached");
      handleNextTurn(true);
    }
  }, [
    timer,
    maxTimerDuration,
    isTimerRunning,
    handleNextTurn,
    setIsTimerRunning,
  ]);

  // --- Break Timer Logic ---
  useEffect(() => {
    let breakInterval: NodeJS.Timeout | null = null;
    if (isOnBreak && breakTimer > 0) {
      breakInterval = setInterval(() => {
        setBreakTimer((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            startNextTurnActual(); // Auto-start next turn
            if (breakInterval) clearInterval(breakInterval);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (breakInterval) clearInterval(breakInterval);
    };
  }, [isOnBreak, breakTimer, startNextTurnActual, setBreakTimer]);

  const handleSkipBreak = () => {
    if (!isOnBreak) return;
    if (confirm("Are you sure you want to skip the remaining break time?")) {
      startNextTurnActual();
    }
  };

  // --- Actions Handlers ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleToggleTimer = useCallback(
    (run: boolean) => {
      if (isOnBreak) {
        toast.info("Cannot control match timer during a break.");
        return;
      }
      if (!batchesConfirmed) {
        toast.error("Please set defender batches before starting the timer.");
        return;
      }

      setIsTimerRunning(run);
      setLastTick(Date.now());

      // SYNC: Immediately tell DB the new state
      syncTimerToDb(timer, run ? "running" : "paused");
    },
    [isOnBreak, batchesConfirmed, timer, setIsTimerRunning, setLastTick]
  );

  const handleResetTimer = useCallback(() => {
    if (isOnBreak) {
      toast.info("Cannot reset match timer during a break.");
      return;
    }
    if (confirm("Are you sure you want to reset the timer to 00:00?")) {
      setTimer(0);
      setIsTimerRunning(false);
      syncTimerToDb(0, "stopped");
      toast.info("Timer reset.");
    }
  }, [isOnBreak, setTimer, setIsTimerRunning]);

  const handleOut = () => {
    if (isConfirming) {
      toast.info("Processing previous action...");
      return;
    }
    if (!isTimerRunning || isOnBreak) {
      toast.error(
        "Timer must be running and not in a break to record an action."
      );
      return;
    }
    setIsConfirming(true);

    if (selectedSymbol === "yellow-card" || selectedSymbol === "red-card") {
      const targetPlayer = selectedDefender || selectedAttacker;
      if (!targetPlayer) {
        toast.error("Select a player to issue a card.");
        setIsConfirming(false);
        return;
      }
      setPendingCardAction({
        symbol: selectedSymbol,
        player: targetPlayer,
        isDefender: !!selectedDefender,
      });
      setShowCardConfirm(true);
      setIsConfirming(false);
      return;
    }
    confirmOut();
  };

  const confirmOut = async () => {
    if (isConfirming) return;
    setIsConfirming(true);

    try {
      const symbolData = SYMBOLS.find((s) => s.type === selectedSymbol);
      if (!symbolData) {
        toast.error("Invalid symbol selected.");
        setIsConfirming(false);
        return;
      }

      const isSingle = symbolData.singlePlayer;
      const defender = selectedDefender;
      const attacker = selectedAttacker;

      if (isSingle) {
        if (!defender && !attacker) {
          toast.error("Select a player for this action.");
          setIsConfirming(false);
          return;
        }
      } else {
        if (!defender || !attacker) {
          toast.error("Select both defender and attacker for this action.");
          setIsConfirming(false);
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
      const perTime = defender ? timer - lastActionTime : 0;
      const scoring_team_id =
        currentDefendingTeam === "A" ? match.teamB.id : match.teamA.id;

      // 1. Insert Action
      const newActionData: Omit<DbScoringAction, "id" | "created_at"> = {
        match_id: match.id,
        inning: currentInning,
        turn: currentTurn,
        scoring_team_id,
        defender_jersey:
          isSingle && !defender ? null : defender?.jerseyNumber || null,
        defender_name: isSingle && !defender ? null : defender?.name || null,
        attacker_jersey:
          isSingle && defender ? null : attacker?.jerseyNumber || null,
        attacker_name: isSingle && defender ? null : attacker?.name || null,
        symbol: selectedSymbol!,
        action_type: "out",
        points: symbolData.points,
        run_time: timer,
        per_time: perTime,
        user_id: userId!,
      };

      const { error: actionError } = await supabase
        .from("scoring_actions")
        .insert([newActionData])
        .select();

      if (actionError) throw new Error(actionError.message);

      // 2. Update Match Score in Real-time
      const pointsToAdd = symbolData.points;
      const isTeamAScoring = scoring_team_id === match.teamA.id;

      const newScoreA = isTeamAScoring
        ? scores.teamA + pointsToAdd
        : scores.teamA;
      const newScoreB = !isTeamAScoring
        ? scores.teamB + pointsToAdd
        : scores.teamB;

      await supabase
        .from("matches")
        .update({
          score_a: newScoreA,
          score_b: newScoreB,
        })
        .eq("id", match.id);

      const targetName = isSingle
        ? defender?.name || attacker?.name
        : defender?.name;
      toast.success(
        `${targetName || "Player"} recorded with symbol: ${symbolData.abbr}`
      );
      setSelectedDefender(null);
      setSelectedAttacker(null);
      setSelectedSymbol(null);
    } catch (err: any) {
      console.error("Error saving action:", err);
      toast.error("Failed to save action: " + err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const confirmCardAction = () => {
    if (!pendingCardAction) return;
    setShowCardConfirm(false);
    if (pendingCardAction.isDefender) {
      setSelectedDefender(pendingCardAction.player);
      setSelectedAttacker(null);
    } else {
      setSelectedAttacker(pendingCardAction.player);
      setSelectedDefender(null);
    }
    setSelectedSymbol(pendingCardAction.symbol);
    confirmOut().finally(() => {
      setPendingCardAction(null);
    });
  };

  const handleUndoLastAction = async () => {
    if (isOnBreak) {
      toast.error("Cannot undo actions during a break.");
      return;
    }
    if (actions.length === 0) {
      toast.error("No actions to undo.");
      return;
    }
    const actionToUndo = actions[actions.length - 1];
    if (!actionToUndo) {
      toast.error("Could not identify the last action.");
      return;
    }
    if (!confirm(`Undo last action: ${actionToUndo.symbol}?`)) {
      return;
    }
    const { error } = await supabase
      .from("scoring_actions")
      .delete()
      .eq("id", actionToUndo.id);
    if (error) {
      toast.error(`Failed to undo last action: ${error.message}`);
    } else {
      toast.success("Last action successfully undone. Score will update.");
    }
  };

  // --- Substitutions ---
  const recordSubstitutionAction = async (
    playerOut: Player,
    playerIn: Player
  ) => {
    if (!userId) return;
    const subActionData = {
      match_id: match.id,
      inning: currentInning,
      turn: currentTurn,
      scoring_team_id:
        currentDefendingTeam === "A" ? match.teamB.id : match.teamA.id,
      attacker_jersey: playerOut.jerseyNumber,
      attacker_name: playerOut.name,
      defender_jersey: playerIn.jerseyNumber,
      defender_name: playerIn.name,
      symbol: "substitute" as SymbolType,
      action_type: "sub",
      points: 0,
      run_time: timer,
      per_time: 0,
      user_id: userId,
    };
    await supabase.from("scoring_actions").insert([subActionData]);
  };

  const handleSubstituteClick = () => {
    if (!isTimerRunning || isOnBreak) {
      toast.error("Timer must be running and not in a break to substitute.");
      return;
    }
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
    recordSubstitutionAction(attackerToSwap, substitute);
    toast.success(`Substituted ${attackerToSwap.name} with ${substitute.name}`);
    setSelectedAttacker(substitute);
    setSubstituteMode(false);
    setAttackerToSwap(null);
  };

  // --- Defender Substitution (Pre-Turn) ---
  const handleOpenDefenderSub = () => {
    if (isTimerRunning || isOnBreak) {
      toast.error("Can only substitute defenders before the turn starts.");
      return;
    }
    const subUsed =
      currentDefendingTeam === "A"
        ? teamADefenderSubUsed[currentInning]
        : teamBDefenderSubUsed[currentInning];
    if (subUsed) {
      toast.info(
        `Defender substitution already used for Inning ${currentInning}.`
      );
      return;
    }
    setShowDefenderSubModal(true);
    setDefenderToSwapOut(null);
    toast.info("Select a playing defender to substitute out.");
  };

  const handleSelectDefenderToSwap = (player: Player) => {
    setDefenderToSwapOut(player);
    toast.info(
      `Selected ${player.name}. Now select a substitute from the bench.`
    );
  };

  const handleSelectDefenderSubstitute = (substituteIn: Player) => {
    if (!defenderToSwapOut) return;
    if (currentDefendingTeam === "A") {
      const newPlaying = teamAPlaying.filter(
        (p) => p.id !== defenderToSwapOut.id
      );
      newPlaying.push(substituteIn);
      const newSubstitutes = teamASubstitutes.filter(
        (p) => p.id !== substituteIn.id
      );
      newSubstitutes.push(defenderToSwapOut);
      setTeamAPlaying(newPlaying);
      setTeamASubstitutes(newSubstitutes);
      setTeamADefenderSubUsed((prev) => ({ ...prev, [currentInning]: true }));
    } else {
      const newPlaying = teamBPlaying.filter(
        (p) => p.id !== defenderToSwapOut.id
      );
      newPlaying.push(substituteIn);
      const newSubstitutes = teamBSubstitutes.filter(
        (p) => p.id !== substituteIn.id
      );
      newSubstitutes.push(defenderToSwapOut);
      setTeamBPlaying(newPlaying);
      setTeamBSubstitutes(newSubstitutes);
      setTeamBDefenderSubUsed((prev) => ({ ...prev, [currentInning]: true }));
    }

    if (batchesConfirmed) {
      const updatedBatches = defenderBatches.map((batch) =>
        batch.map((player) =>
          player.id === defenderToSwapOut.id ? substituteIn : player
        )
      );
      setDefenderBatches(updatedBatches);
    }
    recordSubstitutionAction(defenderToSwapOut, substituteIn);
    toast.success(
      `Substituted defender ${defenderToSwapOut.name} with ${substituteIn.name}.`
    );
    setShowDefenderSubModal(false);
    setDefenderToSwapOut(null);
    setSelectedDefender(null);
  };

  const handleCancelDefenderSub = () => {
    setShowDefenderSubModal(false);
    setDefenderToSwapOut(null);
  };

  // --- Selection Handlers ---
  const handleDefenderSelect = (defender: Player) => {
    if (activeDefenders.some((ad) => ad.id === defender.id)) {
      setSelectedDefender((prev) =>
        prev?.id === defender.id ? null : defender
      );
      setSelectedSymbol(null);
    } else {
      toast.error("This player is not in the active batch.");
    }
    setSubstituteMode(false);
    setAttackerToSwap(null);
  };

  const handleAttackerSelect = (attacker: Player) => {
    setSelectedAttacker((prev) => (prev?.id === attacker.id ? null : attacker));
    setSelectedSymbol(null);
  };

  const handleSymbolSelect = (symbol: SymbolType) => {
    const symbolData = SYMBOLS.find((s) => s.type === symbol);
    if (!symbolData) return;

    if (symbolData.singlePlayer) {
      if (!selectedDefender && !selectedAttacker) {
        toast.error(
          "Please select either a defender OR an attacker for this symbol."
        );
        return;
      }
      if (selectedDefender && selectedAttacker) {
        toast.info(
          "Clearing attacker selection as this symbol applies to one player."
        );
        setSelectedAttacker(null);
      }
    } else {
      if (!selectedDefender) {
        toast.error("Please select a defender first.");
        return;
      }
      if (!selectedAttacker) {
        toast.error("Please select an attacker.");
        return;
      }
    }
    setSelectedSymbol(symbol);
  };

  // --- Match End ---
  const handleEndMatch = () => {
    if (isOnBreak) {
      toast.error("Cannot end the match during a break.");
      return;
    }
    if (currentTurn < 2 && currentInning === 1) {
      toast.error(
        "At least one full inning (2 turns) must be completed before ending the match."
      );
      return;
    }
    setShowEndMatchConfirm(true);
  };

  const confirmEndMatch = async () => {
    // 1. UPDATE DB IMMEDIATELY
    await updateMatchStatusToFinished();

    // 2. CLEAR LOCAL STORAGE
    const keysToRemove = [
      `match_${match.id}_inning`,
      `match_${match.id}_turn`,
      `match_${match.id}_timer`,
      `match_${match.id}_is_running`,
      `match_${match.id}_last_tick`,
      `match_${match.id}_on_break`,
      `match_${match.id}_break_timer`,
      `match_${match.id}_break_type`,
      `match_${match.id}_active_batches`,
      `match_${match.id}_active_batch_idx`,
      `match_${match.id}_batches_confirmed`,
      `match_${match.id}_batch_cycle`,
      `match_${match.id}_saved_batches_A`,
      `match_${match.id}_saved_batches_B`,
      `match_${match.id}_teamA_playing`,
      `match_${match.id}_teamA_subs`,
      `match_${match.id}_teamB_playing`,
      `match_${match.id}_teamB_subs`,
      `match_${match.id}_defending_team`,
    ];
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));

    setIsTimerRunning(false);
    setShowEndMatchConfirm(false);

    // 3. Trigger Parent callback immediately so the user is navigated away
    // or the UI updates instantly. We pass the current actions state.
    onEndMatch(actions as unknown as ScoringAction[]);

    // Optionally show the report modal if you want them to see it before navigating away
    setIsFinalReport(true);
    setShowConsolidatedReport(true);
  };

  const handleCloseReport = () => {
    setShowConsolidatedReport(false);
    setIsFinalReport(false);
  };

  const handleCloseReportAndFinish = () => {
    setShowConsolidatedReport(false);
    setIsFinalReport(false);
    // Navigation is handled by onEndMatch being called in confirmEndMatch
  };

  // --- Batch Modal Handlers ---
  const handleConfirmBatches = (confirmedBatches: Player[][]) => {
    setDefenderBatches(confirmedBatches);
    setBatchesConfirmed(true);
    setActiveBatchIndex(0);
    setShowBatchModal(false);

    if (currentDefendingTeam === "A") {
      setSavedBatchesA(confirmedBatches);
    } else {
      setSavedBatchesB(confirmedBatches);
    }

    toast.success("Defender batches confirmed for this turn!");
  };

  const handleUsePreviousBatches = () => {
    const previousBatches =
      currentDefendingTeam === "A" ? savedBatchesA : savedBatchesB;
    if (previousBatches) {
      setDefenderBatches(previousBatches);
      setBatchesConfirmed(true);
      setActiveBatchIndex(0);
      toast.success("Previous batches loaded successfully!");
    } else {
      toast.error("No previous batches found for this team.");
    }
  };

  // --- Scoresheet Data Preparation ---
  const defenderScoresheet = useMemo(() => {
    return actions
      .filter(
        (a) =>
          a.inning === currentInning &&
          a.turn === currentTurn &&
          getStringValue(a, "defenderName")
      )
      .map((action) => ({
        jerseyNumber: getNumValue(action, "defenderJersey"),
        name: getStringValue(action, "defenderName"),
        perTime: getNumValue(action, "perTime"),
        runTime: getNumValue(action, "runTime"),
        outBy: getStringValue(action, "attackerName"),
        symbol: (action as any).symbol,
      }));
  }, [actions, currentInning, currentTurn]);

  const attackerScoresheet = useMemo(() => {
    const sheet: {
      [key: number]: { name: string; points: number; defendersOut: string[] };
    } = {};
    actions
      .filter((a) => a.inning === currentInning && a.turn === currentTurn)
      .forEach((action) => {
        const attackerJersey = getNumValue(action, "attackerJersey");
        const attackerName = getStringValue(action, "attackerName");
        const defenderName = getStringValue(action, "defenderName");
        const points = getNumValue(action, "points");

        if (!attackerJersey || !attackerName) return;

        if (!sheet[attackerJersey]) {
          sheet[attackerJersey] = {
            name: attackerName,
            points: 0,
            defendersOut: [],
          };
        }
        sheet[attackerJersey].points += points;
        if (defenderName) {
          sheet[attackerJersey].defendersOut.push(defenderName);
        }
      });
    return sheet;
  }, [actions, currentInning, currentTurn]);

  return (
    <>
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

      {showConsolidatedReport && (
        <ConsolidatedReport
          match={match}
          setupData={setupData}
          actions={actions as unknown as ScoringAction[]}
          onClose={
            isFinalReport ? handleCloseReportAndFinish : handleCloseReport
          }
        />
      )}

      {showEditActions && (
        <EditActionsPage
          actions={actions as unknown as ScoringAction[]}
          allDefenders={
            currentDefendingTeam === "A" ? teamAPlaying : teamBPlaying
          }
          allAttackers={
            currentDefendingTeam === "A" ? teamBPlaying : teamAPlaying
          }
          onSave={(edited, remarks) => {
            console.log("Saving edited actions:", edited, "Remarks:", remarks);
            setShowEditActions(false);
            toast.info("Edit saving not implemented yet.");
          }}
          onClose={() => setShowEditActions(false)}
        />
      )}

      <BatchSelectionModal
        isOpen={showBatchModal}
        teamName={
          currentDefendingTeam === "A" ? match.teamA.name : match.teamB.name
        }
        players={allPlayingDefenders}
        initialBatches={batchesConfirmed ? defenderBatches : undefined}
        isReadOnly={batchesConfirmed}
        onConfirm={handleConfirmBatches}
        onCancel={() => setShowBatchModal(false)}
      />

      <div className="min-h-screen bg-gray-50 pb-20">
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
          onNextTurn={() => handleNextTurn(false)}
          onEndMatch={handleEndMatch}
          onResetTimer={handleResetTimer}
          isOnBreak={isOnBreak}
          breakTimer={breakTimer}
          breakType={breakType}
          onSkipBreak={handleSkipBreak}
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 space-y-4">
          {!isOnBreak && !isTimerRunning && (
            <div
              className={cn(
                "border-l-4 p-4",
                !batchesConfirmed
                  ? "bg-yellow-50 border-yellow-400"
                  : "bg-orange-50 border-orange-400"
              )}
              role="alert"
            >
              <div className="flex">
                <div className="py-1">
                  {!batchesConfirmed ? (
                    <Users className="h-5 w-5 text-yellow-400 mr-3" />
                  ) : (
                    <Ban className="h-5 w-5 text-orange-400 mr-3" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "font-bold",
                      !batchesConfirmed ? "text-yellow-800" : "text-orange-800"
                    )}
                  >
                    {!batchesConfirmed ? "Batches Not Set" : "Timer Paused"}
                  </p>
                  <p
                    className={cn(
                      "text-sm",
                      !batchesConfirmed ? "text-yellow-700" : "text-orange-700"
                    )}
                  >
                    {!batchesConfirmed
                      ? 'Click "Set Batches" to assign defender batches.'
                      : 'Scoring is disabled. Press "Start" to resume.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {substituteMode && attackerToSwap && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-900">
                🔄 Substitution Mode: Select a substitute player to replace{" "}
                <strong>{attackerToSwap.name}</strong>
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border border-gray-300 shadow-sm">
              <CardHeader className="border-b bg-blue-50 py-2 flex flex-wrap items-center justify-between">
                <div className="flex gap-2 items-center">
                  <CardTitle className="text-sm text-blue-900">
                    Defenders
                  </CardTitle>
                  <p className="text-xs text-blue-700">
                    {currentDefendingTeam === "A"
                      ? match.teamA.name
                      : match.teamB.name}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenDefenderSub}
                    disabled={
                      isTimerRunning ||
                      isOnBreak ||
                      (currentDefendingTeam === "A"
                        ? teamADefenderSubUsed[currentInning]
                        : teamBDefenderSubUsed[currentInning])
                    }
                    className="text-xs h-7 px-2 border-orange-300 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Sub
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBatchModal(true)}
                    disabled={isTimerRunning || isOnBreak}
                    className={cn(
                      "text-xs h-7 px-2",
                      batchesConfirmed
                        ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                        : "border-blue-300 text-blue-700 hover:bg-blue-100"
                    )}
                  >
                    {batchesConfirmed ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Users className="w-3 h-3 mr-1" />
                    )}
                    {batchesConfirmed ? "View Batches" : "Set Batches"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {!batchesConfirmed &&
                ((currentDefendingTeam === "A" && savedBatchesA) ||
                  (currentDefendingTeam === "B" && savedBatchesB)) ? (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex flex-col gap-2">
                    <p className="text-xs text-blue-800 text-center">
                      Previous batch configuration available.
                    </p>
                    <Button
                      onClick={handleUsePreviousBatches}
                      disabled={isOnBreak}
                      className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                    >
                      <History className="w-3 h-3 mr-2" />
                      Use Previous Batches
                    </Button>
                  </div>
                ) : null}

                {showDefenderSubModal ? (
                  <div className="space-y-3">
                    {!defenderToSwapOut ? (
                      <>
                        <p className="text-sm font-medium text-center">
                          Select Defender to Substitute Out:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {allPlayingDefenders.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => handleSelectDefenderToSwap(player)}
                              className="p-2 rounded-lg border-2 border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all"
                            >
                              <div className="text-center">
                                <div className="w-9 h-9 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white mx-auto mb-1">
                                  {player.jerseyNumber}
                                </div>
                                <p className="text-[10px] text-gray-900 truncate">
                                  {player.name}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-center">
                          Select Substitute to Bring In (for{" "}
                          {defenderToSwapOut.name}):
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {defenderSubstitutes.length > 0 ? (
                            defenderSubstitutes.map((player) => (
                              <button
                                key={player.id}
                                onClick={() =>
                                  handleSelectDefenderSubstitute(player)
                                }
                                className="p-2 rounded-lg border-2 border-green-400 hover:border-green-600 hover:bg-green-50 transition-all"
                              >
                                <div className="text-center">
                                  <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white mx-auto mb-1">
                                    {player.jerseyNumber}
                                  </div>
                                  <p className="text-[10px] text-gray-900 truncate">
                                    {player.name}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="col-span-3 text-center text-gray-500">
                              No substitutes available.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelDefenderSub}
                      className="w-full"
                    >
                      Cancel Substitution
                    </Button>
                  </div>
                ) : (
                  <>
                    {!batchesConfirmed ? (
                      <div className="text-center py-10 text-gray-500 text-sm">
                        Please set defender batches first.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {defenderBatches.map((batch, batchIndex) => (
                          <div
                            key={`batch-${batchIndex}`}
                            className={cn(
                              "border-t pt-2",
                              batchIndex === 0 && "border-t-0 pt-0"
                            )}
                          >
                            <Badge
                              variant={
                                batchIndex === activeBatchIndex
                                  ? "default"
                                  : "secondary"
                              }
                              className={cn(
                                "mb-2",
                                batchIndex === activeBatchIndex
                                  ? "bg-blue-600 animate-pulse"
                                  : "bg-gray-400 opacity-70"
                              )}
                            >
                              Batch {batchIndex + 1}{" "}
                              {batchIndex === activeBatchIndex
                                ? "(Active)"
                                : ""}
                            </Badge>
                            <div className="grid grid-cols-3 gap-2">
                              {batch.map((player) => {
                                const isOut = defendersOutIdsInActiveBatch.has(
                                  player.id
                                );
                                const isActiveBatch =
                                  batchIndex === activeBatchIndex;
                                const isDisabled =
                                  !isTimerRunning ||
                                  substituteMode ||
                                  !isActiveBatch ||
                                  isOut ||
                                  showDefenderSubModal;

                                return (
                                  <button
                                    key={player.id}
                                    onClick={() =>
                                      !isDisabled &&
                                      handleDefenderSelect(player)
                                    }
                                    disabled={isDisabled}
                                    className={cn(
                                      `p-2 rounded-lg border-2 transition-all duration-200`,
                                      isOut
                                        ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                                        : selectedDefender?.id === player.id
                                        ? "border-blue-600 bg-blue-100 shadow-md scale-105"
                                        : !isActiveBatch
                                        ? "border-gray-300 bg-gray-50 opacity-40 cursor-not-allowed"
                                        : isDisabled
                                        ? "border-gray-300 opacity-50 cursor-not-allowed"
                                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:scale-105"
                                    )}
                                  >
                                    <div className="text-center">
                                      <div
                                        className={cn(
                                          `w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-1 text-white`,
                                          isOut || !isActiveBatch
                                            ? "bg-gray-400"
                                            : "bg-gradient-to-br from-blue-600 to-indigo-600"
                                        )}
                                      >
                                        {player.jerseyNumber}
                                      </div>
                                      <p
                                        className={cn(
                                          `text-[10px] truncate leading-tight`,
                                          isOut || !isActiveBatch
                                            ? "text-gray-400"
                                            : "text-gray-900"
                                        )}
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
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
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
                          disabled={!isTimerRunning || isOnBreak}
                          className={cn(
                            `p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105`,
                            selectedAttacker?.id === player.id
                              ? "border-red-600 bg-red-100 shadow-md"
                              : !isTimerRunning || isOnBreak
                              ? "border-gray-300 opacity-50 cursor-not-allowed"
                              : "border-gray-300 hover:border-red-400 hover:bg-gray-50"
                          )}
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
                      disabled={
                        !selectedAttacker || !isTimerRunning || isOnBreak
                      }
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
                  {SYMBOLS.map((symbol) => {
                    const isSingle = symbol.singlePlayer;
                    const isDisabled =
                      !isTimerRunning ||
                      isOnBreak ||
                      substituteMode ||
                      (!isSingle && (!selectedDefender || !selectedAttacker)) ||
                      (isSingle && !selectedDefender && !selectedAttacker);

                    return (
                      <button
                        key={symbol.type}
                        onClick={() =>
                          handleSymbolSelect(symbol.type as SymbolType)
                        }
                        disabled={isDisabled}
                        className={cn(
                          `p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 min-h-[60px] flex flex-col justify-center`,
                          selectedSymbol === symbol.type
                            ? "border-indigo-600 bg-indigo-100 shadow-md"
                            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50",
                          isDisabled ? "opacity-50 cursor-not-allowed" : ""
                        )}
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
                    );
                  })}
                </div>
                <Button
                  onClick={handleOut}
                  disabled={
                    isConfirming ||
                    !isTimerRunning ||
                    isOnBreak ||
                    !selectedSymbol ||
                    (!SYMBOLS.find((s) => s.type === selectedSymbol)
                      ?.singlePlayer &&
                      (!selectedDefender || !selectedAttacker)) ||
                    (SYMBOLS.find((s) => s.type === selectedSymbol)
                      ?.singlePlayer &&
                      !selectedDefender &&
                      !selectedAttacker)
                  }
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 shadow-lg transition-all"
                >
                  {isConfirming ? "Confirming..." : "Confirm Action"}
                </Button>
                {SYMBOLS.some((s) => s.singlePlayer) && (
                  <p className="text-[10px] text-gray-500 text-center mt-1">
                    * Single player symbols (select D or A)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Scoresheet
            inning={currentInning}
            turn={currentTurn}
            defenderScoresheet={defenderScoresheet}
            attackerScoresheet={attackerScoresheet}
            onViewConsolidatedReport={() => {
              setIsFinalReport(false);
              setShowConsolidatedReport(true);
            }}
          />
        </div>
      </div>
    </>
  );
}
