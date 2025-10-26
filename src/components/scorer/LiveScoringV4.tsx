// design/src/components/scorer/LiveScoringV4.tsx

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
import { RefreshCw, Ban, Users, Check } from "lucide-react"; // Added Users, Check
import { Match, Player, ScoringAction, SymbolType } from "../../types";
import { MatchSetupData } from "./MatchSetupEnhanced";
import { toast } from "sonner";
import { ConsolidatedReport } from "./ConsolidatedReport";
import { EditActionsPage } from "./EditActionsPage";
import { supabase } from "../../supabaseClient";
import { Scoreboard } from "./Scoreboard";
import { Scoresheet } from "./Scoresheet";
import { BatchSelectionModal } from "./BatchSelectionModal"; // Import the modal
import { cn } from "../ui/utils"; // Import cn

// Constants remain the same
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

// DbScoringAction and helper functions remain the same
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

export function LiveScoringV4({
  match,
  setupData,
  onBack,
  onEndMatch,
}: LiveScoringV4Props) {
  // --- EXISTING STATE (mostly unchanged) ---
  const [currentInning, setCurrentInning] = useState(1);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [maxTimerDuration] = useState(setupData.timerDuration);
  // --- NEW DEFENDER SUBSTITUTE STATE ---
  const [showDefenderSubModal, setShowDefenderSubModal] = useState(false); // Controls a dedicated modal or UI state
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
  const [isConfirming, setIsConfirming] = useState(false); // Used for saving actions

  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);
  const [breakType, setBreakType] = useState<"turn" | "inning" | null>(null);
  const [batchCycleCount, setBatchCycleCount] = useState(0);

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

  // --- NEW BATCH STATE ---
  const [showBatchModal, setShowBatchModal] = useState(false);
  // Stores batches for the CURRENT defending team for the CURRENT turn, structure: [ [p1, p2, p3], [p4, p5, p6], [p7, p8, p9] ]
  const [defenderBatches, setDefenderBatches] = useState<Player[][]>([]);
  // Index (0, 1, or 2) of the currently active batch
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  // Flag to know if batches are set for the current turn
  const [batchesConfirmed, setBatchesConfirmed] = useState(false);

  // --- MEMOIZED VALUES (Defenders/Attackers depend on batch state now) ---
  const activeBatchIndexRef = useRef(activeBatchIndex);
  // All *playing* defenders for the current defending team (used for modal)
  const allPlayingDefenders = useMemo(
    () => (currentDefendingTeam === "A" ? teamAPlaying : teamBPlaying),
    [currentDefendingTeam, teamAPlaying, teamBPlaying]
  );

  // *Active* defenders (players from the current active batch)
  const activeDefenders = useMemo(() => {
    if (!batchesConfirmed || !defenderBatches[activeBatchIndex]) {
      return []; // Return empty if batches not set or index is invalid
    }
    return defenderBatches[activeBatchIndex];
  }, [batchesConfirmed, defenderBatches, activeBatchIndex]);

  // Attackers (unchanged logic)
  const attackers = useMemo(
    () => (currentDefendingTeam === "A" ? teamBPlaying : teamAPlaying),
    [currentDefendingTeam, teamBPlaying, teamAPlaying]
  );
  const attackerSubstitutes = useMemo(
    () => (currentDefendingTeam === "A" ? teamBSubstitutes : teamASubstitutes),
    [currentDefendingTeam, teamBSubstitutes, teamASubstitutes]
  );

  // Determine which players in the *active batch* are currently out *within this cycle*
  const defendersOutIdsInActiveBatch = useMemo(() => {
    const outIds = new Set<string>();
    if (!batchesConfirmed || !defenderBatches[activeBatchIndex]) {
      return outIds;
    }

    const activeBatchPlayerIds = new Set(
      defenderBatches[activeBatchIndex].map((p) => p.id)
    );

    // Get all 'out' actions for the current turn
    const currentTurnActions = actions.filter(
      (a) =>
        a.inning === currentInning &&
        a.turn === currentTurn &&
        getStringValue(a, "defenderName")
    );

    // Calculate how many outs *should* have happened before this batch became active *this time*
    // (cycle * total players per cycle) + (batch index * players per batch)
    const startIndex =
      (batchCycleCount * TOTAL_BATCHES + activeBatchIndex) * BATCH_SIZE;

    // Only consider actions that happened *during or after* this batch's current activation started
    const actionsForCurrentBatchActivation =
      currentTurnActions.slice(startIndex);

    actionsForCurrentBatchActivation.forEach((action) => {
      // Find the player object based on the action details
      const defenderPlayer = allPlayingDefenders.find(
        (d) =>
          d.jerseyNumber === getNumValue(action, "defenderJersey") &&
          d.name === getStringValue(action, "defenderName")
      );

      // If the player exists and belongs to the currently active batch, mark them as out for this cycle
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
    batchCycleCount, // Add batchCycleCount as a dependency
    allPlayingDefenders,
  ]);

  // --- BATCH CYCLING LOGIC ---
  useEffect(() => {
    // Only run if batches are confirmed and there are batches set
    if (!batchesConfirmed || defenderBatches.length === 0) return;

    // Use the REF here to get the current index without causing re-trigger
    const currentActiveIndex = activeBatchIndexRef.current;
    const activeBatch = defenderBatches[currentActiveIndex];
    if (!activeBatch || activeBatch.length === 0) return; // Check length too

    // Check if all players in the *current active batch* are out
    const allActiveOut = activeBatch.every((player) =>
      defendersOutIdsInActiveBatch.has(player.id)
    );

    if (allActiveOut) {
      // Use the REF here for calculation
      const nextBatchIndex = (currentActiveIndex + 1) % TOTAL_BATCHES;

      if (nextBatchIndex === 0) {
        // Check if we wrapped around
        setBatchCycleCount((prev) => prev + 1);
      }
      setActiveBatchIndex(nextBatchIndex); // Update the state (this will trigger the ref update effect later)
      setSelectedDefender(null); // Reset selection when batch changes
      // Use the REF here for the toast message to reflect the batch that WAS just cleared
      toast.info(
        `Batch ${currentActiveIndex + 1} cleared! Batch ${
          nextBatchIndex + 1
        } is now active.`
      );
    }
    // Only trigger when the set of out players changes or batches are initially confirmed/changed
  }, [defendersOutIdsInActiveBatch, batchesConfirmed, defenderBatches]); // <--- Removed activeBatchIndex

  // --- EXISTING useEffects (fetchUserAndActions, Timers) ---
  // Fetch user ID and subscribe to actions

  useEffect(() => {
    activeBatchIndexRef.current = activeBatchIndex;
  }, [activeBatchIndex]);
  useEffect(() => {
    const fetchUserAndActions = async () => {
      // ... (fetch user ID - no change) ...
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Fetch initial actions (no change)
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

    // Subscribe to changes (no change)
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
          /* ... handle insert/delete ... */
          if (payload.eventType === "INSERT") {
            setActions((currentActions) => {
              // Avoid adding duplicates if already present
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

  // Match Timer useEffect (no change from previous explanation)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!isOnBreak && isTimerRunning && timer < maxTimerDuration) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxTimerDuration) {
            setIsTimerRunning(false);
            toast.warning("⏰ Turn Over! Time limit reached", {
              duration: 3000,
            });
            handleNextTurn(true); // Automatically trigger next turn/break
            return maxTimerDuration;
          }
          return newTime;
        });
      }, 1000);
    }
    // Cleanup function
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer, maxTimerDuration, isOnBreak]);

  const startNextTurnActual = useCallback(() => {
    setIsOnBreak(false); // End break mode
    setBreakTimer(0);
    setBreakType(null);

    const newTurn = currentTurn + 1;
    let newInning = currentInning;
    let isNewInning = false;

    // Check if it's the start of a new inning (after turn 2, 4, etc.)
    if (currentTurn % 2 === 0) {
      newInning = currentInning + 1;
      setCurrentInning(newInning);
      isNewInning = true;
    }

    if (isNewInning) {
      setCurrentInning(newInning);
    }

    // Check if match should end based on innings (e.g., 4 turns = 2 innings)
    const totalTurnsToPlay = (match.innings || 2) * 2; // Default to 2 innings (4 turns) if not specified
    if (newTurn > totalTurnsToPlay) {
      toast.success(`All innings completed! Match Finished.`);
      setShowEndMatchConfirm(true); // Trigger end match confirmation
      return; // Don't proceed further
    }

    if (isNewInning) {
      toast.success(
        // Use the newInning variable here for the message
        `Inning ${currentInning} Over! Starting Inning ${newInning}, Turn ${newTurn}.`
      );
    } else {
      toast.success(`Turn ${newTurn} started.`);
    }

    setCurrentTurn(newTurn);
    setTimer(0);
    setIsTimerRunning(false);
    setCurrentDefendingTeam((prev) => (prev === "A" ? "B" : "A"));

    // Reset selections and batch state
    setSelectedDefender(null);
    setSelectedAttacker(null);
    setSelectedSymbol(null);
    setBatchesConfirmed(false);
    setDefenderBatches([]);
    setActiveBatchIndex(0);
    setBatchCycleCount(0);
    // Reset defender sub selection state for the new turn
    setDefenderToSwapOut(null);
    setShowDefenderSubModal(false); // Close sub modal if it was somehow open
    setShowBatchModal(true); // Open batch modal
  }, [currentInning, currentTurn, match.innings]); // Dependencies

  // Break Timer useEffect (no change from previous explanation)
  useEffect(() => {
    let breakInterval: NodeJS.Timeout | null = null;
    if (isOnBreak && breakTimer > 0) {
      breakInterval = setInterval(() => {
        setBreakTimer((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            startNextTurnActual(); // Automatically start next turn when break ends
            if (breakInterval) clearInterval(breakInterval); // Ensure interval stops
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    // Cleanup function
    return () => {
      if (breakInterval) clearInterval(breakInterval);
    };
  }, [isOnBreak, breakTimer, startNextTurnActual]); // startNextTurnActual is stable

  // --- FUNCTIONS (Many are existing, some modified) ---

  const formatTime = (seconds: number) => {
    /* ... no change ... */
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
        // <-- Prevent starting timer if batches not set
        toast.error("Please set defender batches before starting the timer.");
        return;
      }
      setIsTimerRunning(run);
    },
    [isOnBreak, batchesConfirmed] // <-- Added batchesConfirmed dependency
  );

  const handleResetTimer = useCallback(() => {
    /* ... no change ... */
    if (isOnBreak) {
      toast.info("Cannot reset match timer during a break.");
      return;
    }
    if (confirm("Are you sure you want to reset the timer to 00:00?")) {
      setTimer(0);
      setIsTimerRunning(false); // Optionally pause the timer on reset
      toast.info("Timer reset.");
    }
  }, [isOnBreak]);

  // Player/Symbol Selection Handlers (no change)
  const handleDefenderSelect = (defender: Player) => {
    /* ... no change ... */
    // Ensure the selected defender is actually in the active batch before setting
    if (activeDefenders.some((ad) => ad.id === defender.id)) {
      setSelectedDefender((prev) =>
        prev?.id === defender.id ? null : defender
      );
      setSelectedSymbol(null); // Reset symbol when defender changes
    } else {
      toast.error("This player is not in the active batch.");
    }
    // Reset other potentially conflicting selections
    // setSelectedAttacker(null); // Keep attacker selection if user misclicks defender? Maybe.
    setSubstituteMode(false);
    setAttackerToSwap(null);
  };
  const handleAttackerSelect = (attacker: Player) => {
    /* ... no change ... */
    setSelectedAttacker((prev) => (prev?.id === attacker.id ? null : attacker));
    setSelectedSymbol(null); // Reset symbol when attacker changes
  };
  const handleSymbolSelect = (symbol: SymbolType) => {
    /* ... no change ... */
    const symbolData = SYMBOLS.find((s) => s.type === symbol);
    if (!symbolData) return;

    // Check if the symbol requires only one player
    if (symbolData.singlePlayer) {
      if (!selectedDefender && !selectedAttacker) {
        toast.error(
          "Please select either a defender OR an attacker for this symbol."
        );
        return;
      }
      // If one is selected, clear the other to avoid ambiguity
      if (selectedDefender && selectedAttacker) {
        toast.info(
          "Clearing attacker selection as this symbol applies to one player."
        );
        setSelectedAttacker(null);
      }
    } else {
      // Regular symbols require both
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

  // Substitute Handlers (no change)
  const handleSubstituteClick = () => {
    /* ... no change ... */
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
    /* ... no change ... */
    if (!attackerToSwap) return;

    // Perform the swap in the correct team's state
    if (currentDefendingTeam === "A") {
      // Attacking team is B
      const newPlaying = teamBPlaying.filter((p) => p.id !== attackerToSwap.id);
      newPlaying.push(substitute);
      const newSubstitutes = teamBSubstitutes.filter(
        (p) => p.id !== substitute.id
      );
      newSubstitutes.push(attackerToSwap);
      setTeamBPlaying(newPlaying);
      setTeamBSubstitutes(newSubstitutes);
    } else {
      // Attacking team is A
      const newPlaying = teamAPlaying.filter((p) => p.id !== attackerToSwap.id);
      newPlaying.push(substitute);
      const newSubstitutes = teamASubstitutes.filter(
        (p) => p.id !== substitute.id
      );
      newSubstitutes.push(attackerToSwap);
      setTeamAPlaying(newPlaying);
      setTeamASubstitutes(newSubstitutes);
    }

    // Record the substitution action (optional, but good practice)
    recordSubstitutionAction(attackerToSwap, substitute);

    toast.success(`Substituted ${attackerToSwap.name} with ${substitute.name}`);

    // Update selection and mode
    setSelectedAttacker(substitute); // Select the newly substituted player
    setSubstituteMode(false);
    setAttackerToSwap(null);
  };

  // Optional: Function to record substitution as an action
  const recordSubstitutionAction = async (
    playerOut: Player,
    playerIn: Player
  ) => {
    if (!userId) return; // Need user ID

    const subActionData = {
      match_id: match.id,
      inning: currentInning,
      turn: currentTurn,
      scoring_team_id:
        currentDefendingTeam === "A" ? match.teamB.id : match.teamA.id, // ID of the team making the sub
      // Store who went out/in for clarity, could use attacker fields or dedicated columns
      attacker_jersey: playerOut.jerseyNumber, // Player coming OUT
      attacker_name: playerOut.name,
      defender_jersey: playerIn.jerseyNumber, // Player coming IN
      defender_name: playerIn.name,
      symbol: "substitute" as SymbolType, // Custom symbol or use existing if applicable
      action_type: "sub", // Specific action type
      points: 0,
      run_time: timer,
      per_time: 0, // Not applicable for sub
      user_id: userId,
    };

    const { error } = await supabase
      .from("scoring_actions")
      .insert([subActionData]);
    if (error) {
      toast.error("Failed to record substitution: " + error.message);
    }
  };

  // Handle Out/Confirm Action (minor changes)
  const handleOut = () => {
    /* ... (add isConfirming check - no other change) ... */
    if (isConfirming) {
      toast.info("Processing previous action...");
      return; // Already processing, do nothing
    }
    if (!isTimerRunning || isOnBreak) {
      // Added check
      toast.error(
        "Timer must be running and not in a break to record an action."
      );
      return;
    }
    setIsConfirming(true); // Set confirming state

    // Check for card confirmation first
    if (selectedSymbol === "yellow-card" || selectedSymbol === "red-card") {
      const targetPlayer = selectedDefender || selectedAttacker;
      if (!targetPlayer) {
        toast.error("Select a player to issue a card.");
        setIsConfirming(false); // Reset confirming state
        return;
      }
      setPendingCardAction({
        symbol: selectedSymbol,
        player: targetPlayer,
        isDefender: !!selectedDefender,
      });
      setShowCardConfirm(true);
      setIsConfirming(false); // Reset here, confirmation happens in dialog action
      return; // Wait for dialog confirmation
    }

    // Directly confirm if not a card
    confirmOut();
  };

  const confirmOut = async () => {
    // --- THIS MUST BE HERE ---
    if (isConfirming) {
      return;
    } // Prevent double clicks during async operation
    setIsConfirming(true); // Mark as processing

    try {
      const symbolData = SYMBOLS.find((s) => s.type === selectedSymbol);
      if (!symbolData) {
        toast.error("Invalid symbol selected."); // Should not happen
        setIsConfirming(false);
        return;
      }

      const isSingle = symbolData.singlePlayer;
      const defender = selectedDefender;
      const attacker = selectedAttacker;

      // Validation
      if (isSingle) {
        if (!defender && !attacker) {
          toast.error("Select a player for this action.");
          setIsConfirming(false);
          return;
        }
        // If both are selected for a single player action, prioritize defender (or attacker based on your rule)
        if (defender && attacker) {
          toast.info(
            `Applying ${symbolData.name} to defender ${defender.name}. Attacker selection ignored.`
          );
          // setSelectedAttacker(null); // Optionally clear the ignored selection
        }
      } else {
        if (!defender || !attacker) {
          toast.error("Select both defender and attacker for this action.");
          setIsConfirming(false);
          return;
        }
      }
      if (!selectedSymbol) {
        // Should be caught earlier, but double-check
        toast.error("Select a symbol.");
        setIsConfirming(false);
        return;
      }

      // Calculate timings
      const currentTurnActions = actions.filter(
        (a) => a.inning === currentInning && a.turn === currentTurn
      );
      const lastActionTime =
        currentTurnActions.length > 0
          ? currentTurnActions[currentTurnActions.length - 1].run_time
          : 0;
      // Per time is only relevant if a defender was involved
      const perTime = defender ? timer - lastActionTime : 0;

      // Determine scoring team (usually the attacking team)
      const scoring_team_id =
        currentDefendingTeam === "A" ? match.teamB.id : match.teamA.id;

      // Prepare data for DB
      const newActionData: Omit<DbScoringAction, "id" | "created_at"> = {
        match_id: match.id,
        inning: currentInning,
        turn: currentTurn,
        scoring_team_id,
        // Use defender if selected, otherwise null (especially for single player actions on attacker)
        defender_jersey:
          isSingle && !defender ? null : defender?.jerseyNumber || null,
        defender_name: isSingle && !defender ? null : defender?.name || null,
        // Use attacker if selected AND it's not a single player action applied ONLY to defender
        attacker_jersey:
          isSingle && defender ? null : attacker?.jerseyNumber || null,
        attacker_name: isSingle && defender ? null : attacker?.name || null,
        symbol: selectedSymbol,
        action_type: "out", // Could refine this based on symbol
        points: symbolData.points,
        run_time: timer,
        per_time: perTime,
        user_id: userId!, // Assume userId is available
      };

      // --- Save to Supabase ---
      const { error } = await supabase
        .from("scoring_actions")
        .insert([newActionData])
        .select(); // Selecting ensures the listener gets the new data if subscription lags

      if (error) {
        toast.error("Failed to save action: " + error.message);
      } else {
        const targetName = isSingle
          ? defender?.name || attacker?.name
          : defender?.name; // Default to defender name for 'out' message
        toast.success(
          `${targetName || "Player"} recorded with symbol: ${symbolData.abbr}`
        );
        // Don't manually update state here, rely on the subscription

        // Reset selections
        setSelectedDefender(null);
        setSelectedAttacker(null); // Always reset attacker too
        setSelectedSymbol(null);
      }
    } catch (err) {
      console.error("Error during confirmOut:", err);
      toast.error("An unexpected error occurred while saving the action.");
    } finally {
      setIsConfirming(false); // Ensure this runs even if there's an error
    }
  };

  const confirmCardAction = () => {
    /* ... no change ... */
    if (!pendingCardAction) return;
    setShowCardConfirm(false);

    // Temporarily set selections to match the card action target
    const originalDefender = selectedDefender;
    const originalAttacker = selectedAttacker;
    const originalSymbol = selectedSymbol;

    if (pendingCardAction.isDefender) {
      setSelectedDefender(pendingCardAction.player);
      setSelectedAttacker(null); // Clear attacker for single player action
    } else {
      setSelectedAttacker(pendingCardAction.player);
      setSelectedDefender(null); // Clear defender for single player action
    }
    setSelectedSymbol(pendingCardAction.symbol);

    // Call confirmOut which now handles single player logic
    confirmOut().finally(() => {
      // Restore original selections (optional, might be better to just clear)
      // setSelectedDefender(originalDefender);
      // setSelectedAttacker(originalAttacker);
      // setSelectedSymbol(originalSymbol); // Symbol should clear in confirmOut anyway
      setPendingCardAction(null); // Clear pending action
    });
  };

  const handleUndoLastAction = async () => {
    /* ... no change ... */
    if (isOnBreak) {
      // Added check
      toast.error("Cannot undo actions during a break.");
      return;
    }
    if (actions.length === 0) {
      toast.error("No actions to undo.");
      return;
    }

    // Find the actual last action from the state (which includes subscription updates)
    const actionToUndo = actions[actions.length - 1];
    if (!actionToUndo) {
      toast.error("Could not identify the last action.");
      return;
    }

    // Optional: Add confirmation
    if (
      !confirm(
        `Undo last action: ${actionToUndo.symbol} involving ${
          actionToUndo.defender_name || actionToUndo.attacker_name
        }?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("scoring_actions")
      .delete()
      .eq("id", actionToUndo.id); // Use the ID from the state

    if (error) {
      toast.error(`Failed to undo last action: ${error.message}`);
    } else {
      toast.success("Last action successfully undone.");
      // State update will happen via subscription, no manual removal needed here
      // Ensure selections are reset if the undone action involved them? Maybe not necessary.
    }
  };

  const scores = useMemo(() => {
    /* ... no change ... */
    const teamAId = match.teamA.id;
    const teamBId = match.teamB.id;
    const teamAScore = actions
      .filter((a) => a.scoring_team_id === teamAId)
      .reduce((sum, a) => sum + (a.points || 0), 0); // Added default 0 for points
    const teamBScore = actions
      .filter((a) => a.scoring_team_id === teamBId)
      .reduce((sum, a) => sum + (a.points || 0), 0); // Added default 0 for points
    return { teamA: teamAScore, teamB: teamBScore };
  }, [actions, match.teamA.id, match.teamB.id]);

  const defenderSubstitutes = useMemo(
    () => (currentDefendingTeam === "A" ? teamASubstitutes : teamBSubstitutes),
    [currentDefendingTeam, teamASubstitutes, teamBSubstitutes]
  );

  // --- NEW: Defender Substitution Handlers ---

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
    setDefenderToSwapOut(null); // Reset selection
    toast.info("Select a playing defender to substitute out.");
  };

  const handleSelectDefenderToSwap = (player: Player) => {
    setDefenderToSwapOut(player);
    toast.info(
      `Selected ${player.name}. Now select a substitute from the bench.`
    );
  };

  const handleSelectDefenderSubstitute = (substituteIn: Player) => {
    if (!defenderToSwapOut) return; // Should not happen

    // Perform the swap
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
      // Defending team is B
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

    // Update batches if they are already set for this turn
    if (batchesConfirmed) {
      const updatedBatches = defenderBatches.map((batch) =>
        batch.map((player) =>
          player.id === defenderToSwapOut.id ? substituteIn : player
        )
      );
      setDefenderBatches(updatedBatches);
    }

    // Record the substitution action (optional)
    recordSubstitutionAction(defenderToSwapOut, substituteIn);

    toast.success(
      `Substituted defender ${defenderToSwapOut.name} with ${substituteIn.name}.`
    );
    setShowDefenderSubModal(false);
    setDefenderToSwapOut(null);
    setSelectedDefender(null); // Clear selection in case the swapped out player was selected
  };

  const handleCancelDefenderSub = () => {
    setShowDefenderSubModal(false);
    setDefenderToSwapOut(null);
  };

  // Handle Next Turn (Modified to trigger break)
  const handleNextTurn = (autoTriggered = false) => {
    if (isOnBreak) {
      toast.info("Already in a break.");
      return;
    }

    const confirmMessage = autoTriggered
      ? `Turn ${currentTurn} ended due to time limit. Start the break?`
      : `End Turn ${currentTurn} and start the break?`;

    // Only ask for confirmation if not auto-triggered by timer expiry
    if (!autoTriggered && !confirm(confirmMessage)) {
      return;
    }

    setIsTimerRunning(false); // Pause match timer

    // Determine break type and duration
    let breakDuration = TURN_BREAK_DURATION;
    let nextBreakType: "turn" | "inning" = "turn";
    let toastMessage = `Turn ${currentTurn} finished. Starting ${formatTime(
      TURN_BREAK_DURATION
    )} break.`;

    if (currentTurn % 2 === 0) {
      // End of an inning (after turn 2, 4, etc.)
      breakDuration = INNING_BREAK_DURATION;
      nextBreakType = "inning";
      toastMessage = `Inning ${currentInning} finished. Starting ${formatTime(
        INNING_BREAK_DURATION
      )} break.`;
    }

    setBreakType(nextBreakType);
    setBreakTimer(breakDuration);
    setIsOnBreak(true); // Start break mode
    toast.info(toastMessage);

    // Reset batch confirmation for the *next* turn
    setBatchesConfirmed(false);
    setDefenderBatches([]);
    setActiveBatchIndex(0);
  };
  const handleSkipBreak = () => {
    if (!isOnBreak) return;
    if (confirm("Are you sure you want to skip the remaining break time?")) {
      // It's safer to directly call the function that handles the transition
      startNextTurnActual();
      // Setting timer and break state to false is handled within startNextTurnActual now
    }
  };

  const handleEndMatch = () => {
    /* ... (add isOnBreak check - no other change) ... */
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
  const confirmEndMatch = () => {
    /* ... no change ... */
    setIsTimerRunning(false); // Stop timer if running
    setShowEndMatchConfirm(false);
    setIsFinalReport(true); // Mark report as final
    setShowConsolidatedReport(true); // Show report
  };

  const handleCloseReport = () => {
    /* ... no change ... */
    setShowConsolidatedReport(false);
    setIsFinalReport(false);
  };
  const handleCloseReportAndFinish = () => {
    /* ... no change ... */
    setShowConsolidatedReport(false);
    setIsFinalReport(false);
    onEndMatch(actions as unknown as ScoringAction[]); // Call the original end match logic passed via props
  };

  // Scoresheet data calculations (no change)
  const defenderScoresheet = useMemo(() => {
    /* ... */
    return actions
      .filter(
        (a) =>
          a.inning === currentInning &&
          a.turn === currentTurn &&
          getStringValue(a, "defenderName") // Ensure defender was involved
      )
      .map((action) => ({
        jerseyNumber: getNumValue(action, "defenderJersey"),
        name: getStringValue(action, "defenderName"),
        perTime: getNumValue(action, "perTime"),
        runTime: getNumValue(action, "runTime"),
        outBy: getStringValue(action, "attackerName"), // Name of attacker who got them out
        symbol: (action as any).symbol, // The symbol used for the out
      }));
  }, [actions, currentInning, currentTurn]);

  const attackerScoresheet = useMemo(() => {
    /* ... */
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

        if (!attackerJersey || !attackerName) return; // Skip if no attacker involved

        if (!sheet[attackerJersey]) {
          sheet[attackerJersey] = {
            name: attackerName,
            points: 0,
            defendersOut: [],
          };
        }
        sheet[attackerJersey].points += points;
        if (defenderName) {
          // Only add defender if one was involved in the action
          sheet[attackerJersey].defendersOut.push(defenderName);
        }
      });
    return sheet;
  }, [actions, currentInning, currentTurn]);

  // --- NEW: Batch Confirmation Handler ---
  const handleConfirmBatches = (confirmedBatches: Player[][]) => {
    setDefenderBatches(confirmedBatches);
    setBatchesConfirmed(true);
    setActiveBatchIndex(0); // Start with the first batch
    setShowBatchModal(false);
    toast.success("Defender batches confirmed for this turn!");
  };

  // --- RENDER LOGIC ---
  return (
    <>
      {/* Modals: End Match, Card Confirm, Consolidated Report, Edit Actions */}
      <AlertDialog
        open={showEndMatchConfirm}
        onOpenChange={setShowEndMatchConfirm}
      >
        {/* ... (End Match Confirm Dialog content - no change) ... */}
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
        {/* ... (Card Confirm Dialog content - no change) ... */}
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

      {/* Conditional Rendering for Report Modal */}
      {showConsolidatedReport && (
        // Use ViewResultModal which wraps ConsolidatedReport
        // Pass the necessary props, including the potentially reconstructed setupData if needed
        // Pass the necessary props
        <ConsolidatedReport
          match={match}
          setupData={setupData} // Pass the original setup data
          actions={actions as unknown as ScoringAction[]} // Cast might be needed depending on type strictness
          onClose={
            isFinalReport ? handleCloseReportAndFinish : handleCloseReport
          }
        />
      )}

      {showEditActions && (
        <EditActionsPage
          actions={actions as unknown as ScoringAction[]} // Type assertion might be needed
          // Pass *all* playing members for dropdowns, not just active defenders/attackers
          allDefenders={
            currentDefendingTeam === "A" ? teamAPlaying : teamBPlaying
          }
          allAttackers={
            currentDefendingTeam === "A" ? teamBPlaying : teamAPlaying
          }
          onSave={(edited, remarks) => {
            // TODO: Implement logic to save edited actions (e.g., call Supabase function)
            console.log("Saving edited actions:", edited, "Remarks:", remarks);
            setShowEditActions(false);
            toast.info("Edit saving not implemented yet.");
          }}
          onClose={() => setShowEditActions(false)}
        />
      )}

      {/* --- NEW: Batch Selection Modal --- */}
      <BatchSelectionModal
        isOpen={showBatchModal}
        teamName={
          currentDefendingTeam === "A" ? match.teamA.name : match.teamB.name
        }
        players={allPlayingDefenders} // Pass the 9 playing defenders
        // Pass existing batches if editing/viewing, otherwise undefined
        initialBatches={batchesConfirmed ? defenderBatches : undefined}
        // Set read-only if batches are confirmed AND timer is running (or break)
        isReadOnly={batchesConfirmed && (isTimerRunning || isOnBreak)}
        onConfirm={handleConfirmBatches}
        onCancel={() => setShowBatchModal(false)}
      />

      {/* Main Scoring Layout */}
      <div className="min-h-screen bg-gray-50 pb-20">
        <Scoreboard
          // ... (props remain the same) ...
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
          onResetTimer={handleResetTimer}
          isOnBreak={isOnBreak} // Pass break state
          breakTimer={breakTimer} // Pass break timer
          breakType={breakType} // Pass break type
          onSkipBreak={handleSkipBreak} // Pass skip function
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 space-y-4">
          {/* Timer Paused / Batch Not Set Warning */}
          {!isOnBreak &&
            !isTimerRunning && ( // Show only if NOT on break
              <div
                className={cn(
                  "border-l-4 p-4",
                  !batchesConfirmed
                    ? "bg-yellow-50 border-yellow-400" // Batch warning
                    : "bg-orange-50 border-orange-400" // Timer paused warning
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
                        !batchesConfirmed
                          ? "text-yellow-800"
                          : "text-orange-800"
                      )}
                    >
                      {!batchesConfirmed ? "Batches Not Set" : "Timer Paused"}
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        !batchesConfirmed
                          ? "text-yellow-700"
                          : "text-orange-700"
                      )}
                    >
                      {!batchesConfirmed
                        ? 'Click "Set/View Batches" for the defending team before starting.'
                        : 'Scoring is disabled. Press "Start" to resume.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Substitute Mode Info */}
          {substituteMode && attackerToSwap && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-900">
                🔄 Substitution Mode: Select a substitute player to replace{" "}
                <strong>{attackerToSwap.name}</strong>
              </p>
            </div>
          )}

          {/* Grids Container */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Defenders Card */}
            <Card className="border border-gray-300 shadow-sm">
              <CardHeader className="border-b bg-blue-50 py-2 flex flex-row items-center justify-between">
                <div className="flex gap-2">
                  <CardTitle className="text-sm text-blue-900">
                    Defenders
                  </CardTitle>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {currentDefendingTeam === "A"
                      ? match.teamA.name
                      : match.teamB.name}
                  </p>
                </div>

                {/* --- NEW: Substitute Defender Button --- */}
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
                  Sub Defender{" "}
                  {currentDefendingTeam === "A"
                    ? teamADefenderSubUsed[currentInning]
                      ? "(Used)"
                      : ""
                    : teamBDefenderSubUsed[currentInning]
                    ? "(Used)"
                    : ""}
                </Button>
                {/* --- NEW: Set Batches Button --- */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBatchModal(true)}
                  // Disable if timer is running OR on break
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
              </CardHeader>
              <CardContent className="p-3">
                {/* --- NEW: Defender Substitution UI --- */}
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
                    {/* Existing Batch Display Logic */}
                    {!batchesConfirmed ? (
                      <div className="text-center py-10 text-gray-500 text-sm">
                        Please set defender batches first.
                      </div>
                    ) : (
                      // ... (The existing batch rendering div starting with <div className="space-y-3"> ) ...
                      <div className="space-y-3">
                        {defenderBatches.map((batch, batchIndex) => (
                          <div
                            key={`batch-${batchIndex}`}
                            className={cn(
                              "border-t pt-2",
                              batchIndex === 0 && "border-t-0 pt-0" // No top border for the first batch
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
                                // Combined disabled conditions
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
                                        ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed" // Player is out
                                        : selectedDefender?.id === player.id
                                        ? "border-blue-600 bg-blue-100 shadow-md scale-105" // Player is selected
                                        : !isActiveBatch
                                        ? "border-gray-300 bg-gray-50 opacity-40 cursor-not-allowed" // Player not in active batch
                                        : !isTimerRunning ||
                                          substituteMode ||
                                          showDefenderSubModal // Add showDefenderSubModal here
                                        ? "border-gray-300 opacity-50 cursor-not-allowed" // Timer off, sub mode, or defender sub modal open
                                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:scale-105" // Player is selectable
                                    )}
                                  >
                                    {/* Player Button Content */}
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

            {/* Attackers Card (No change in rendering logic, just ensure disabled state works) */}
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
                {/* ... (Substitute logic and rendering - no change needed here) ... */}
                {!substituteMode ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {attackers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handleAttackerSelect(player)}
                          // Disable if timer not running OR break active
                          disabled={!isTimerRunning || isOnBreak}
                          className={cn(
                            `p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105`,
                            selectedAttacker?.id === player.id
                              ? "border-red-600 bg-red-100 shadow-md"
                              : !isTimerRunning || isOnBreak // Use combined condition
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
                      // Disable if no attacker selected OR timer not running OR break active
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
                  // Substitute Selection UI (no change needed here)
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

            {/* Symbols Card (Ensure disabled state includes isOnBreak) */}
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
                      !isTimerRunning || // Timer off
                      isOnBreak || // On break
                      substituteMode || // In sub mode
                      (!isSingle && (!selectedDefender || !selectedAttacker)) || // Normal symbol, missing player
                      (isSingle && !selectedDefender && !selectedAttacker); // Single symbol, missing player

                    return (
                      <button
                        key={symbol.type}
                        onClick={() =>
                          handleSymbolSelect(symbol.type as SymbolType)
                        }
                        disabled={isDisabled}
                        className={cn(
                          `p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 min-h-[60px] flex flex-col justify-center`, // Added min height and flex
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
                    isOnBreak || // Disable during break
                    !selectedSymbol ||
                    (!SYMBOLS.find((s) => s.type === selectedSymbol)
                      ?.singlePlayer &&
                      (!selectedDefender || !selectedAttacker)) ||
                    (SYMBOLS.find((s) => s.type === selectedSymbol)
                      ?.singlePlayer &&
                      !selectedDefender &&
                      !selectedAttacker) // Check if at least one is selected for single player
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

          {/* Scoresheet */}
          <Scoresheet
            inning={currentInning}
            turn={currentTurn}
            defenderScoresheet={defenderScoresheet}
            attackerScoresheet={attackerScoresheet}
            onViewConsolidatedReport={() => {
              setIsFinalReport(false); // It's not the final report when viewed mid-match
              setShowConsolidatedReport(true);
            }}
          />
        </div>
      </div>
    </>
  );
}
