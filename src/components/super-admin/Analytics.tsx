import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Users,
  Activity,
  Download,
  Calendar
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Analytics() {
  // Mock data
  const tournamentsPerMonth = [
    { month: 'Jan', tournaments: 8, matches: 45 },
    { month: 'Feb', tournaments: 12, matches: 68 },
    { month: 'Mar', tournaments: 15, matches: 82 },
    { month: 'Apr', tournaments: 18, matches: 95 },
    { month: 'May', tournaments: 22, matches: 118 },
    { month: 'Jun', tournaments: 25, matches: 142 },
  ];

  const matchesByCategory = [
    { category: 'Senior Men', count: 145 },
    { category: 'Senior Women', count: 98 },
    { category: 'Junior Boys', count: 76 },
    { category: 'Junior Girls', count: 62 },
    { category: 'Youth', count: 45 },
  ];

  const liveViewersTrend = [
    { time: '10 AM', viewers: 250 },
    { time: '11 AM', viewers: 380 },
    { time: '12 PM', viewers: 520 },
    { time: '1 PM', viewers: 680 },
    { time: '2 PM', viewers: 890 },
    { time: '3 PM', viewers: 1250 },
    { time: '4 PM', viewers: 1450 },
    { time: '5 PM', viewers: 1680 },
  ];

  const topAdmins = [
    { name: 'Mike Ross', tournaments: 15, matches: 95, scorers: 18 },
    { name: 'John Doe', tournaments: 12, matches: 78, scorers: 15 },
    { name: 'Sarah Khan', tournaments: 10, matches: 62, scorers: 12 },
    { name: 'Lisa Marie', tournaments: 8, matches: 48, scorers: 10 },
    { name: 'Tom Smith', tournaments: 7, matches: 42, scorers: 8 },
  ];

  const scorerActivity = [
    { date: 'Mon', active: 42, total: 68 },
    { date: 'Tue', active: 38, total: 68 },
    { date: 'Wed', active: 45, total: 72 },
    { date: 'Thu', active: 52, total: 75 },
    { date: 'Fri', active: 58, total: 78 },
    { date: 'Sat', active: 65, total: 82 },
    { date: 'Sun', active: 48, total: 85 },
  ];

  const platformLoadData = [
    { hour: '00:00', load: 12 },
    { hour: '03:00', load: 8 },
    { hour: '06:00', load: 15 },
    { hour: '09:00', load: 45 },
    { hour: '12:00', load: 78 },
    { hour: '15:00', load: 95 },
    { hour: '18:00', load: 85 },
    { hour: '21:00', load: 62 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-gray-900">Analytics & Reports</h2>
          <p className="text-sm text-gray-600">Platform performance and usage insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-gray-700 border-gray-300">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" className="text-gray-700 border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              <Badge className="bg-green-100 text-green-700 border-green-200 border">
                <TrendingUp className="w-3 h-3 mr-1" />
                +18%
              </Badge>
            </div>
            <p className="text-sm text-gray-600">Tournaments (This Month)</p>
            <p className="text-2xl text-gray-900">25</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <Badge className="bg-green-100 text-green-700 border-green-200 border">
                <TrendingUp className="w-3 h-3 mr-1" />
                +22%
              </Badge>
            </div>
            <p className="text-sm text-gray-600">Total Matches</p>
            <p className="text-2xl text-gray-900">142</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-700 border-green-200 border">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15%
              </Badge>
            </div>
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl text-gray-900">1,680</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <Badge className="bg-red-100 text-red-700 border-red-200 border">
                <TrendingDown className="w-3 h-3 mr-1" />
                -5%
              </Badge>
            </div>
            <p className="text-sm text-gray-600">Avg Session (min)</p>
            <p className="text-2xl text-gray-900">24</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tournaments Per Month */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Tournaments Created Per Month</CardTitle>
            <p className="text-sm text-gray-600">Growth trend over 6 months</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={tournamentsPerMonth}>
                <defs>
                  <linearGradient id="colorTournaments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tournaments" 
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill="url(#colorTournaments)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Matches by Category */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Matches by Category</CardTitle>
            <p className="text-sm text-gray-600">Distribution across age groups and genders</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={matchesByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="category" type="category" stroke="#6b7280" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Viewers Trend */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Live Viewers Trend</CardTitle>
            <p className="text-sm text-gray-600">Real-time audience throughout the day</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={liveViewersTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="viewers" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scorer Activity */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Scorer Activity Graph</CardTitle>
            <p className="text-sm text-gray-600">Active vs total scorers this week</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scorerActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="active" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Active Scorers" />
                <Bar dataKey="total" fill="#e5e7eb" radius={[8, 8, 0, 0]} name="Total Scorers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Busiest Admins */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Top 5 Busiest Admins</CardTitle>
          <p className="text-sm text-gray-600">Most active organizers on the platform</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Rank</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Admin Name</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Tournaments</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Matches</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Scorers</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Activity Score</th>
                </tr>
              </thead>
              <tbody>
                {topAdmins.map((admin, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{admin.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 border">
                        {admin.tournaments}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      <Badge className="bg-green-100 text-green-700 border-green-200 border">
                        {admin.matches}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
                        {admin.scorers}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(admin.tournaments / 15) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-8">{Math.round((admin.tournaments / 15) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Platform Load Heatmap */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Platform Load Heatmap</CardTitle>
          <p className="text-sm text-gray-600">Server load distribution throughout the day</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={platformLoadData}>
              <defs>
                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="load" 
                stroke="#ef4444" 
                fillOpacity={1}
                fill="url(#colorLoad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
