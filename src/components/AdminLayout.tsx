import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Trophy,
  Calendar,
  Users,
  UserCog,
  CheckSquare,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "./ui/button";
import { Toaster } from "./ui/sonner";
import { Separator } from "./ui/separator";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import { useLocation, useNavigate } from "react-router-dom"; // Import necessary hooks

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  userName: string;
}

// Reusable Sidebar Content Component
const SidebarContent = ({
  userName,
  onLogout,
  onLinkClick,
}: {
  userName: string;
  onLogout: () => void;
  onLinkClick?: () => void; // Optional handler to close drawer on mobile
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      id: "home",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/home",
    },
    {
      id: "tournaments",
      label: "Tournaments",
      icon: Trophy,
      path: "/admin/tournaments",
    },
    { id: "matches", label: "Matches", icon: Calendar, path: "/admin/matches" },
    { id: "teams", label: "Teams", icon: Users, path: "/admin/teams" },
    { id: "scorers", label: "Scorers", icon: UserCog, path: "/admin/scorers" },
    {
      id: "results",
      label: "Results",
      icon: CheckSquare,
      path: "/admin/results",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-200 relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-10 pr-4">
          <Trophy className="w-16 h-16 text-white" />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white">Admin Panel</h1>
            <p className="text-blue-100 text-xs">Tournament System</p>
          </div>
        </div>
      </div>

      {/* Navigation and User Info */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if the current path starts with the item's path (for nested routes like /tournaments/edit/1)
            const isActive = currentPath.startsWith(item.path);
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  onLinkClick?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <Separator className="my-4" />
        <div>
          <div className="px-2 mb-3">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <Button onClick={onLogout} variant="outline" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>
    </div>
  );
};

export function AdminLayout({
  children,
  onLogout,
  userName,
}: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <Toaster position="top-right" />
      <Drawer
        direction="left"
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      >
        <div className="h-screen flex flex-col">
          {/* Top Navigation Bar - Mobile */}
          <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-gray-900">Admin Panel</h1>
            </div>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DrawerTrigger>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200">
              <SidebarContent userName={userName} onLogout={onLogout} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>

        {/* This is the content that will slide out on mobile */}
        <DrawerContent className="w-64 h-full">
          <SidebarContent
            userName={userName}
            onLogout={onLogout}
            onLinkClick={() => setIsMobileMenuOpen(false)} // Closes menu on link click
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
