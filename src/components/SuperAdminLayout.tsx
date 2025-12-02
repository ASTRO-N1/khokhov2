import { ReactNode } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  Activity, 
  BarChart3, 
  Shield,
  LogOut,
  Bell
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';

interface SuperAdminLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function SuperAdminLayout({ 
  children, 
  currentPage,
  onNavigate,
  onLogout 
}: SuperAdminLayoutProps) {
  const navItems = [
    { id: 'super-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'super-admins', label: 'Admin Management', icon: Users },
    { id: 'super-plans', label: 'Subscription Plans', icon: CreditCard },
    { id: 'super-settings', label: 'Platform Settings', icon: Settings },
    { id: 'super-logs', label: 'Activity Logs', icon: Activity },
    { id: 'super-analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'super-security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">Super Admin</h1>
              <p className="text-xs text-gray-600">Platform Control</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => onNavigate(item.id)}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>

        {/* Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarFallback className="bg-purple-100 text-purple-700">SA</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">Super Admin</p>
              <p className="text-xs text-gray-600 truncate">admin@kho-kho.com</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-gray-700 border-gray-300"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h2 className="text-gray-900">
              {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-gray-600">Manage and monitor platform operations</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
