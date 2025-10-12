// src/components/scorer/ActionButtons.tsx

import { ActionType } from "../../types";
import { Button } from "../ui/button";

interface ActionButtonsProps {
  selectedAction: ActionType;
  onSelectAction: (action: ActionType) => void;
  onRecordAction: () => void;
  isRecordDisabled: boolean;
}

const actionButtons: { value: ActionType; label: string }[] = [
  { value: "out", label: "Out (+2)" },
  { value: "kho", label: "Kho" },
  { value: "foul", label: "Foul" },
  { value: "sub", label: "Substitute" },
  { value: "yellow", label: "Yellow Card" },
  { value: "red", label: "Red Card" },
];

export function ActionButtons({
  selectedAction,
  onSelectAction,
  onRecordAction,
  isRecordDisabled,
}: ActionButtonsProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">2. Select Action</h3>
      <div className="grid grid-cols-2 gap-2">
        {actionButtons.map((action) => (
          <button
            key={action.value}
            onClick={() => onSelectAction(action.value)}
            className={`p-3 border-2 rounded-lg text-center transition-all ${
              selectedAction === action.value
                ? "border-blue-600 bg-blue-50 font-bold"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <div className="font-medium">{action.label}</div>
          </button>
        ))}
      </div>
      <Button
        onClick={onRecordAction}
        className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
        disabled={isRecordDisabled}
      >
        Record Action
      </Button>
    </div>
  );
}
