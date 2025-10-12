// design/src/components/scorer/ViewResultModal.tsx

import { Button } from "../ui/button";
import { X } from "lucide-react";
import { Match, ScoringAction } from "../../types";
import { MatchSetupData } from "./MatchSetupEnhanced";
import { ConsolidatedReport } from "./ConsolidatedReport";

interface ViewResultModalProps {
  match: Match;
  onClose: () => void;
  // Guaranteed to be fetched/reconstructed by ScorerHomeEnhanced
  actions: ScoringAction[];
  setupData: MatchSetupData;
}

export function ViewResultModal({
  match,
  onClose,
  actions,
  setupData,
}: ViewResultModalProps) {
  // We simply render the ConsolidatedReport directly inside the modal's container.
  // The ConsolidatedReport handles all the score, winner, and statistical display.

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* The outer container holds the modal's styling and dimensions */}
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* We pass all the complex data to the ConsolidatedReport */}
        <ConsolidatedReport
          match={match}
          setupData={setupData}
          actions={actions}
          onClose={onClose} // Passed directly from ScorerHomeEnhanced (which just closes the modal)
        />
      </div>
    </div>
  );
}
