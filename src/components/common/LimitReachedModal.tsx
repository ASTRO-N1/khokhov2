import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Crown, Zap } from "lucide-react";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: string; // e.g., "Tournaments"
  currentPlan: string;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  resource,
  currentPlan,
}: LimitReachedModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-6 bg-white rounded-xl shadow-xl">
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto bg-amber-100 p-3 rounded-full w-fit">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <AlertDialogTitle className="text-center text-xl font-bold text-gray-900">
              Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              You have reached the maximum number of{" "}
              <span className="font-semibold text-gray-900">{resource}</span>{" "}
              allowed on your{" "}
              <span className="font-semibold text-blue-600">
                {currentPlan} Plan
              </span>
              .
              <br />
              <br />
              To continue growing your organization, please upgrade your
              subscription or contact the Super Admin.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Info Box */}
        <div className="bg-gray-50 p-4 rounded-lg my-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600 fill-blue-600 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">Need more capacity?</p>
              <p className="text-gray-500">
                Upgrade to Professional for unlimited access.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons - Inside the card flow */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            Maybe Later
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md"
            onClick={() => {
              onClose();
              // Optional: navigate('/admin/subscription')
            }}
          >
            Upgrade Plan
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
