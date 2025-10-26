// design/src/components/scorer/BatchSelectionModal.tsx

import React, { useState, useMemo, useEffect } from "react";
import { Player } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertCircle, RotateCcw, Check, Users, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../ui/utils";

interface BatchSelectionModalProps {
  teamName: string;
  players: Player[]; // Should receive exactly 9 players
  initialBatches?: Player[][]; // Optional: For viewing existing batches
  onConfirm: (batches: Player[][]) => void;
  onCancel: () => void;
  isOpen: boolean;
  isReadOnly?: boolean; // If true, just displays batches
}

const BATCH_SIZE = 3;
const TOTAL_BATCHES = 3;
const REQUIRED_PLAYERS = BATCH_SIZE * TOTAL_BATCHES;

export function BatchSelectionModal({
  teamName,
  players,
  initialBatches,
  onConfirm,
  onCancel,
  isOpen,
  isReadOnly = false,
}: BatchSelectionModalProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => {
    // Initialize selection order if viewing existing batches
    if (isReadOnly && initialBatches) {
      return initialBatches.flat().map((p) => p.id);
    }
    return [];
  });

  // Calculate batches based on selection order or initial data
  const currentBatches = useMemo(() => {
    if (isReadOnly && initialBatches) {
      return initialBatches;
    }
    const batches: Player[][] = Array.from({ length: TOTAL_BATCHES }, () => []);
    selectedPlayerIds.forEach((id, index) => {
      const batchIndex = Math.floor(index / BATCH_SIZE);
      const player = players.find((p) => p.id === id);
      if (player && batchIndex < TOTAL_BATCHES) {
        batches[batchIndex].push(player);
      }
    });
    return batches;
  }, [selectedPlayerIds, players, isReadOnly, initialBatches]);

  const currentBatchNumber = useMemo(
    () => Math.floor(selectedPlayerIds.length / BATCH_SIZE) + 1,
    [selectedPlayerIds]
  );
  const isSelectionComplete = useMemo(
    () => selectedPlayerIds.length === REQUIRED_PLAYERS,
    [selectedPlayerIds]
  );

  // Reset state when modal opens for selection (not for read-only)
  useEffect(() => {
    if (isOpen && !isReadOnly) {
      setSelectedPlayerIds([]);
    } else if (isOpen && isReadOnly && initialBatches) {
      // Set initial state for read-only view
      setSelectedPlayerIds(initialBatches.flat().map((p) => p.id));
    }
  }, [isOpen, isReadOnly, initialBatches]);

  if (!isOpen) {
    return null;
  }

  // Adjusted error check for flexibility
  if (!isReadOnly && players.length !== REQUIRED_PLAYERS) {
    console.error(
      `BatchSelectionModal requires exactly ${REQUIRED_PLAYERS} playing members for ${teamName} during selection, received ${players.length}.`
    );
    // Render error within modal structure
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <Card className="bg-white shadow-xl max-w-lg w-full">
          <CardHeader className="bg-red-100 border-red-300 border-b flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-red-800 text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Configuration Error
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-red-800 hover:bg-red-200"
            >
              Close
            </Button>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-red-700">
              Batch selection requires exactly {REQUIRED_PLAYERS} playing
              members selected for {teamName}. Current setup seems incorrect.
              Please check match setup or player status.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePlayerSelect = (player: Player) => {
    if (
      isReadOnly ||
      isSelectionComplete ||
      selectedPlayerIds.includes(player.id)
    )
      return;

    const newSelection = [...selectedPlayerIds, player.id];
    setSelectedPlayerIds(newSelection);

    const newCurrentBatchNum = Math.floor(newSelection.length / BATCH_SIZE) + 1;
    const playersInNewCurrentBatch = newSelection.slice(
      (newCurrentBatchNum - 1) * BATCH_SIZE
    ).length;

    if (newSelection.length === REQUIRED_PLAYERS) {
      toast.success("All players assigned to batches!");
    } else if (
      playersInNewCurrentBatch === 0 &&
      newCurrentBatchNum <= TOTAL_BATCHES
    ) {
      toast.info(
        `Batch ${
          newCurrentBatchNum - 1
        } complete. Selecting for Batch ${newCurrentBatchNum}.`
      );
    }
  };

  const handleReset = () => {
    if (isReadOnly) return;
    setSelectedPlayerIds([]);
    toast.info("Batch selections reset.");
  };

  const handleConfirmBatches = () => {
    if (isReadOnly) {
      onCancel(); // Just close if read-only
      return;
    }
    if (!isSelectionComplete) {
      toast.error(
        `Please select all ${REQUIRED_PLAYERS} players into batches.`
      );
      return;
    }
    onConfirm(currentBatches);
  };

  const getBadgeVariant = (index: number) => {
    const batchNum = index + 1;
    const isCompleted = isSelectionComplete || batchNum < currentBatchNumber;
    const isCurrent = !isSelectionComplete && batchNum === currentBatchNumber;

    if (isCompleted) return "default";
    if (isCurrent) return "secondary";
    return "outline";
  };

  const getBadgeClassNames = (index: number) => {
    const batchNum = index + 1;
    const isCompleted = isSelectionComplete || batchNum < currentBatchNumber;
    const isCurrent = !isSelectionComplete && batchNum === currentBatchNumber;

    return cn(
      "px-4 py-1.5 text-sm transition-all duration-300",
      isCompleted ? "bg-green-600 border-green-600 text-white" : "",
      isCurrent
        ? "bg-blue-100 text-blue-800 border-blue-400 scale-110 shadow-md animate-pulse"
        : "",
      !isCompleted && !isCurrent ? "border-gray-300 text-gray-500" : ""
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <Card className="bg-white shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%] duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-blue-200 sticky top-0 z-10 flex flex-row items-center justify-between py-4 px-6">
          <div>
            <CardTitle className="text-blue-900 text-lg">
              {isReadOnly ? "View" : "Set"} Defender Batches:{" "}
              <span className="font-bold">{teamName}</span>
            </CardTitle>
            {!isReadOnly && (
              <p className="text-sm text-blue-700 mt-1">
                Select players sequentially for Batch 1, then Batch 2, then
                Batch 3.
              </p>
            )}
            {isReadOnly && (
              <p className="text-sm text-gray-600 mt-1">
                Batches confirmed for this turn.
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-gray-600 hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 flex-1 overflow-y-auto">
          {/* Batch Progress Indicator */}
          <div className="mb-5 flex justify-center space-x-3 items-center">
            <span className="text-sm font-medium text-gray-600">
              {isReadOnly ? "Confirmed Batches:" : "Assigning:"}
            </span>
            {[...Array(TOTAL_BATCHES)].map((_, index) => {
              const batchNum = index + 1;
              const isCompleted =
                isSelectionComplete || batchNum < currentBatchNumber;
              const playersInThisBatch = currentBatches[index]?.length || 0;

              return (
                <Badge
                  key={index}
                  variant={getBadgeVariant(index)}
                  className={getBadgeClassNames(index)}
                >
                  Batch {batchNum} ({playersInThisBatch}/{BATCH_SIZE}){" "}
                  {isCompleted && <Check className="w-3 h-3 ml-1 inline" />}
                </Badge>
              );
            })}
          </div>

          {/* Player Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {/* Display based on batches if read-only, otherwise allow selection */}
            {(isReadOnly ? currentBatches.flat() : players).map((player) => {
              const isSelected = selectedPlayerIds.includes(player.id);
              const batchNum = isSelected
                ? Math.floor(
                    selectedPlayerIds.indexOf(player.id) / BATCH_SIZE
                  ) + 1
                : null;
              const isSelectable =
                !isReadOnly && !isSelected && !isSelectionComplete;

              return (
                <button
                  key={player.id}
                  onClick={() => isSelectable && handlePlayerSelect(player)}
                  disabled={!isSelectable && !isReadOnly} // Disable only if not selectable and not read-only
                  className={cn(
                    `p-3 border-2 rounded-lg text-center transition-all duration-200 flex flex-col items-center justify-between h-full relative group
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`,
                    isSelected && batchNum
                      ? `border-blue-500 bg-blue-50 shadow-inner`
                      : "",
                    isSelectable
                      ? `border-gray-300 hover:border-blue-400 hover:bg-gray-50 cursor-pointer`
                      : "",
                    // Dim if not selectable during selection OR if read-only but not selected (shouldn't happen with flat())
                    !isSelectable && !isSelected && !isReadOnly
                      ? `border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed`
                      : "",
                    isReadOnly && !isSelected
                      ? "border-gray-200 bg-gray-50 opacity-70"
                      : "" // Style for read-only non-selected (fallback)
                  )}
                >
                  {isSelected && batchNum && (
                    <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 z-10 rounded-full h-5 min-w-5 flex items-center justify-center">
                      B{batchNum}
                    </Badge>
                  )}
                  <div
                    className={cn(
                      `w-10 h-10 rounded-full flex items-center justify-center text-white mx-auto mb-1 text-sm font-semibold transition-colors`,
                      isSelected
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                        : "bg-gradient-to-br from-gray-500 to-gray-700 opacity-80",
                      // Make hover effect conditional on selectability
                      isSelectable ? "group-hover:opacity-100" : ""
                    )}
                  >
                    {player.jerseyNumber}
                  </div>
                  <p
                    className={cn(
                      `text-[11px] leading-tight font-medium truncate w-full mt-auto`,
                      isSelected ? "text-blue-900" : "text-gray-700"
                    )}
                  >
                    {player.name}
                  </p>
                </button>
              );
            })}
          </div>

          {isSelectionComplete && !isReadOnly && (
            <div className="mt-5 p-3 bg-green-50 border border-green-300 rounded text-center flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                All players assigned! Ready to confirm.
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer with Actions */}
        <div className="p-4 border-t bg-gray-50 sticky bottom-0 z-10 flex justify-between items-center">
          {isReadOnly ? (
            <div /> // Placeholder to keep Confirm button on the right
          ) : (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={selectedPlayerIds.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          <Button
            onClick={handleConfirmBatches}
            disabled={!isSelectionComplete && !isReadOnly} // Disable confirm unless complete or read-only
            className={cn(
              "px-6 py-2.5",
              isReadOnly
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isReadOnly ? (
              "Close"
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Confirm Batches
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
