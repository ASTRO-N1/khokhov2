import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Trophy, 
  Radio, 
  UserCheck, 
  Eye,
  CreditCard,
  TrendingUp,
  Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function SuperAdminDashboard() {
  // Mock data
  const platformUsageData = [
    { date: 'Jan', users: 120, matches: 45 },
    { date: 'Feb', users: 180, matches: 68 },
    { date: 'Mar', users: 240, matches: 92 },
    { date: 'Apr', users: 310, matches: 115 },
    { date: 'May', users: 390, matches: 148 },
    { date: 'Jun', users: 450, matches: 172 },
  ];

  const tournamentsPerAdmin = [
    { admin: 'John D.', tournaments: 12 },
    { admin: 'Sarah K.', tournaments: 8 },
    { admin: 'Mike R.', tournaments: 15 },
    { admin: 'Lisa M.', tournaments: 6 },
    { admin: 'Tom S.', tournaments: 10 },
  ];

  const subscriptionData = [
    { name: 'Active', value: 42, color: '#10b981' },
    { name: 'Expired', value: 8, color: '#ef4444' },
    { name: 'Trial', value: 15, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Admins</p>
                <p className="text-3xl text-gray-900">65</p>
                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200 border">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% this month
                </Badge>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Tournaments</p>
                <p className="text-3xl text-gray-900">48</p>
                <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200 border">
                  23 completed
                </Badge>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Live Matches Now</p>
                <p className="text-3xl text-gray-900">7</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  <p className="text-xs text-gray-600">Broadcasting live</p>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Radio className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Scorers</p>
                <p className="text-3xl text-gray-900">142</p>
                <Badge className="mt-2 bg-purple-100 text-purple-700 border-purple-200 border">
                  <UserCheck className="w-3 h-3 mr-1" />
                  89 active now
                </Badge>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Platform Traffic</p>
                <p className="text-3xl text-gray-900">2.4K</p>
                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200 border">
                  <Eye className="w-3 h-3 mr-1" />
                  1,250 online
                </Badge>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow lg:col-span-3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Subscription Overview</p>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <p className="text-2xl text-gray-900">42</p>
                    <Badge className="mt-1 bg-green-100 text-green-700 border-green-200 border">
                      Active
                    </Badge>
                  </div>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div>
                    <p className="text-2xl text-gray-900">8</p>
                    <Badge className="mt-1 bg-red-100 text-red-700 border-red-200 border">
                      Expired
                    </Badge>
                  </div>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div>
                    <p className="text-2xl text-gray-900">15</p>
                    <Badge className="mt-1 bg-yellow-100 text-yellow-700 border-yellow-200 border">
                      Trial
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Usage Line Chart */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Platform Usage Over Time</CardTitle>
            <p className="text-sm text-gray-600">Users and matches trend</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={platformUsageData}>
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
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="matches" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Matches"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tournaments Per Admin Bar Chart */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Tournaments Per Admin</CardTitle>
            <p className="text-sm text-gray-600">Top 5 active organizers</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tournamentsPerAdmin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="admin" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="tournaments" 
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  name="Tournaments"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution Pie Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Subscription Distribution</CardTitle>
          <p className="text-sm text-gray-600">Active, expired, and trial subscriptions</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {subscriptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Platform Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'New admin registered', admin: 'John Doe', time: '5 mins ago', type: 'success' },
              { action: 'Tournament created', admin: 'Sarah Khan', time: '12 mins ago', type: 'info' },
              { action: 'Match started', admin: 'Mike Ross', time: '18 mins ago', type: 'live' },
              { action: 'Subscription renewed', admin: 'Lisa Marie', time: '25 mins ago', type: 'success' },
              { action: 'Scorer assigned', admin: 'Tom Smith', time: '32 mins ago', type: 'info' },
            ].map((activity, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-600' :
                    activity.type === 'live' ? 'bg-red-600' : 'bg-blue-600'
                  }`}></div>
                  <div>
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">by {activity.admin}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
