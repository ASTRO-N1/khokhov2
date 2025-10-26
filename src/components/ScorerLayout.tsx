import { ReactNode } from "react";
import { Trophy, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Toaster } from "./ui/sonner";

interface ScorerLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  onBack?: () => void;
  userName: string;
  title?: string;
  showHeader?: boolean; // New prop to conditionally show/hide header
}

export function ScorerLayout({
  children,
  onLogout,
  onBack,
  userName,
  title,
  showHeader = true,
}: ScorerLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - Conditionally rendered */}
      {showHeader && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="mr-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900">
                    {title || "Scorer Dashboard"}
                  </h1>
                  <p className="text-blue-600">Kho-Kho Scoring</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-gray-900">{userName}</p>
                  <p className="text-gray-500">Scorer</p>
                </div>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={showHeader ? "p-4 lg:p-8 pb-20" : ""}>{children}</main>
    </div>
  );
}
