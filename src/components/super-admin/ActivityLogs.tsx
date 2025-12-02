import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Filter, 
  Calendar,
  Search,
  Download,
  Lock,
  RotateCcw,
  User,
  Trophy,
  Activity,
  Settings as SettingsIcon
} from 'lucide-react';

interface Log {
  id: string;
  timestamp: string;
  actionType: string;
  performedBy: string;
  affectedEntity: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  category: 'match' | 'admin' | 'tournament' | 'system';
}

export function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const mockLogs: Log[] = [
    {
      id: '1',
      timestamp: '2024-11-21 14:35:22',
      actionType: 'Match Started',
      performedBy: 'scorer@example.com',
      affectedEntity: 'Match #12 (Tournament: State Championship)',
      ipAddress: '192.168.1.45',
      category: 'match'
    },
    {
      id: '2',
      timestamp: '2024-11-21 14:20:15',
      actionType: 'Admin Suspended',
      performedBy: 'admin@kho-kho.com',
      affectedEntity: 'Admin: John Doe',
      oldValue: 'Active',
      newValue: 'Suspended',
      ipAddress: '192.168.1.100',
      category: 'admin'
    },
    {
      id: '3',
      timestamp: '2024-11-21 13:45:08',
      actionType: 'Tournament Created',
      performedBy: 'john@example.com',
      affectedEntity: 'Tournament: Inter College Championship',
      ipAddress: '192.168.1.67',
      category: 'tournament'
    },
    {
      id: '4',
      timestamp: '2024-11-21 13:30:42',
      actionType: 'Score Updated',
      performedBy: 'scorer@example.com',
      affectedEntity: 'Match #8 (Team A vs Team B)',
      oldValue: 'Score: 12',
      newValue: 'Score: 14',
      ipAddress: '192.168.1.45',
      category: 'match'
    },
    {
      id: '5',
      timestamp: '2024-11-21 12:15:30',
      actionType: 'System Settings Changed',
      performedBy: 'admin@kho-kho.com',
      affectedEntity: 'Match Rules: Turn Duration',
      oldValue: '7 minutes',
      newValue: '9 minutes',
      ipAddress: '192.168.1.100',
      category: 'system'
    },
    {
      id: '6',
      timestamp: '2024-11-21 11:50:18',
      actionType: 'Admin Created',
      performedBy: 'admin@kho-kho.com',
      affectedEntity: 'Admin: Sarah Khan',
      ipAddress: '192.168.1.100',
      category: 'admin'
    },
    {
      id: '7',
      timestamp: '2024-11-21 11:20:05',
      actionType: 'Match Completed',
      performedBy: 'scorer@example.com',
      affectedEntity: 'Match #5 (Tournament: District Cup)',
      ipAddress: '192.168.1.45',
      category: 'match'
    },
    {
      id: '8',
      timestamp: '2024-11-21 10:45:12',
      actionType: 'Team Added',
      performedBy: 'john@example.com',
      affectedEntity: 'Tournament: State Championship',
      ipAddress: '192.168.1.67',
      category: 'tournament'
    },
  ];

  const [logs, setLogs] = useState(mockLogs);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'match':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'admin':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'tournament':
        return <Trophy className="w-4 h-4 text-green-600" />;
      case 'system':
        return <SettingsIcon className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'match':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">Match</Badge>;
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 border">Admin</Badge>;
      case 'tournament':
        return <Badge className="bg-green-100 text-green-700 border-green-200 border">Tournament</Badge>;
      case 'system':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200 border">System</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">{category}</Badge>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.affectedEntity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-gray-900">Activity Logs</h2>
          <p className="text-sm text-gray-600">Monitor all platform activities and changes</p>
        </div>
        <Button variant="outline" className="text-gray-700 border-gray-300">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="match">Match</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Events Today</p>
            <p className="text-2xl text-gray-900">248</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Match Activities</p>
            <p className="text-2xl text-gray-900">142</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Admin Actions</p>
            <p className="text-2xl text-gray-900">68</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">System Changes</p>
            <p className="text-2xl text-gray-900">12</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Action Type</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Performed By</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Affected Entity</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Changes</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">IP Address</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(log.category)}
                        {getCategoryBadge(log.category)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.actionType}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.performedBy}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 max-w-[250px]">
                      <div className="truncate" title={log.affectedEntity}>
                        {log.affectedEntity}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {log.oldValue && log.newValue ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                            {log.oldValue}
                          </Badge>
                          <span className="text-gray-400">→</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            {log.newValue}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {log.category === 'match' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-orange-600"
                              title="Lock Match"
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-blue-600"
                              title="Rollback"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredLogs.length} of {logs.length} logs
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-600 text-white border-blue-600">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
