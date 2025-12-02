import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { 
  Settings, 
  Clock, 
  Activity, 
  Hash,
  Users,
  Edit,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Bell,
  Database
} from 'lucide-react';

export function PlatformSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Mock symbols data
  const mockSymbols = [
    { id: '1', symbol: 'ST', name: 'Simple Touch', points: 2 },
    { id: '2', symbol: 'SA', name: 'Sudden Attack', points: 2 },
    { id: '3', symbol: 'PD', name: 'Pole Dive', points: 2 },
    { id: '4', symbol: 'D', name: 'Dive', points: 2 },
    { id: '5', symbol: 'T', name: 'Tap', points: 2 },
    { id: '6', symbol: 'TC', name: 'Turn Closure', points: 0 },
  ];

  const [symbols, setSymbols] = useState(mockSymbols);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Platform Settings</h2>
        <p className="text-sm text-gray-600">Configure global platform rules and settings</p>
      </div>

      {/* Match Rules Section */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-gray-900">Match Rules</CardTitle>
          </div>
          <p className="text-sm text-gray-600">Default match configuration settings</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="turnDuration" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                Default Turn Duration (minutes)
              </Label>
              <Input 
                id="turnDuration" 
                type="number"
                defaultValue="9"
                placeholder="9"
              />
              <p className="text-xs text-gray-600">Standard duration for each turn</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inningDuration" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                Default Inning Duration (minutes)
              </Label>
              <Input 
                id="inningDuration" 
                type="number"
                defaultValue="18"
                placeholder="18"
              />
              <p className="text-xs text-gray-600">Standard duration for each inning</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numTurns" className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-600" />
                Number of Turns per Inning
              </Label>
              <Input 
                id="numTurns" 
                type="number"
                defaultValue="2"
                placeholder="2"
              />
              <p className="text-xs text-gray-600">Turns in each inning</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTeams" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                Max Teams Per Tournament
              </Label>
              <Input 
                id="maxTeams" 
                type="number"
                defaultValue="16"
                placeholder="16"
              />
              <p className="text-xs text-gray-600">Maximum teams allowed</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Save Match Rules
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global Symbols Section */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-gray-900">Global Symbols List</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Manage scoring symbols and their point values</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Symbol
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Symbol</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Name</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Points</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((symbol) => (
                  <tr key={symbol.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
                        {symbol.symbol}
                      </Badge>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-900">{symbol.name}</td>
                    <td className="py-3 px-6">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        +{symbol.points} pts
                      </Badge>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Settings Section */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-gray-900">System Settings</CardTitle>
          </div>
          <p className="text-sm text-gray-600">Platform-wide system configuration</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-900">Maintenance Mode</p>
                <p className="text-xs text-gray-600">Temporarily disable platform access for updates</p>
              </div>
            </div>
            <Switch 
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>

          {maintenanceMode && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-900">Platform is in maintenance mode</p>
                  <p className="text-xs text-yellow-700 mt-1">All users except super admins are blocked from accessing the platform</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-900">Platform Notifications</p>
                <p className="text-xs text-gray-600">Enable email notifications for critical events</p>
              </div>
            </div>
            <Switch 
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          {/* Data Retention */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <Label>Data Retention Settings</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matchDataRetention" className="text-sm">
                  Match Data Retention (days)
                </Label>
                <Input 
                  id="matchDataRetention" 
                  type="number"
                  defaultValue="365"
                  placeholder="365"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logRetention" className="text-sm">
                  Activity Log Retention (days)
                </Label>
                <Input 
                  id="logRetention" 
                  type="number"
                  defaultValue="90"
                  placeholder="90"
                />
              </div>
            </div>
          </div>

          {/* Theme Colors (Read-only) */}
          <div className="space-y-3">
            <Label>Theme Colors (Read-only)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-full h-8 bg-blue-600 rounded mb-2"></div>
                <p className="text-xs text-gray-600 text-center">Primary Blue</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-full h-8 bg-red-600 rounded mb-2"></div>
                <p className="text-xs text-gray-600 text-center">Accent Red</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-full h-8 bg-white border border-gray-300 rounded mb-2"></div>
                <p className="text-xs text-gray-600 text-center">White</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-full h-8 bg-gray-900 rounded mb-2"></div>
                <p className="text-xs text-gray-600 text-center">Dark Gray</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Save System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
