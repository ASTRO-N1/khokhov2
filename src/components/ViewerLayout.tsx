import { ReactNode } from "react";
import { Button } from "./ui/button";
import { LogOut, Trophy, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface ViewerLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  userName?: string;
  showHeader?: boolean;
}

export function ViewerLayout({
  children,
  onLogout,
  userName,
  showHeader = true,
}: ViewerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Map routes to IDs for highlighting
  const getCurrentPageId = () => {
    const path = location.pathname;
    if (path.includes("/viewer/home") || path === "/viewer")
      return "viewer-home";
    return "";
  };

  const currentPage = getCurrentPageId();

  const navItems = [
    {
      id: "viewer-home",
      label: "Tournaments",
      icon: Trophy,
      path: "/viewer/home",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-white">
      {showHeader && (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Title */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate("/viewer/home")}
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900 font-bold leading-tight">
                    Kho-Kho Live
                  </h1>
                  <p className="text-xs text-gray-500">Tournament Viewer</p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={currentPage === item.id ? "default" : "ghost"}
                      onClick={() => navigate(item.path)}
                      className={
                        currentPage === item.id
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>

              {/* User & Logout */}
              <div className="flex items-center gap-2">
                {userName && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {userName}
                    </span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
