import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Users,
  Trophy,
  Radio,
  UserCheck,
  Activity,
  CreditCard,
  TrendingUp,
  Shirt,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../supabaseClient";
import { format, subMonths, isSameMonth, parseISO } from "date-fns";

export function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);

  // KPI Data
  const [counts, setCounts] = useState({
    admins: 0,
    adminTrend: 0,
    tournaments: 0,
    tournamentsCompleted: 0,
    liveMatches: 0,
    scorers: 0,
    players: 0,
    teams: 0,
  });

  // Chart Data
  const [usageData, setUsageData] = useState<any[]>([]);
  const [adminPerformance, setAdminPerformance] = useState<any[]>([]);
  const [subscriptionCounts, setSubscriptionCounts] = useState([
    { name: "Basic", value: 0, color: "#10b981" },
    { name: "Professional", value: 0, color: "#8b5cf6" },
    { name: "Enterprise", value: 0, color: "#f59e0b" },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchRealData();
  }, []);

  async function fetchRealData() {
    try {
      setLoading(true);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, role, created_at, plan_type, name");
      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("id, user_id, created_at, start_date, end_date");
      const { data: matches } = await supabase
        .from("matches")
        .select("id, created_at, match_datetime, status");
      const { data: teams } = await supabase.from("teams").select("id");
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!profiles || !tournaments || !matches) return;

      const now = new Date();
      const lastMonth = subMonths(now, 1);

      // KPI Calculations
      const admins = profiles.filter((p) => p.role === "admin");
      const adminsLastMonth = admins.filter((p) =>
        isSameMonth(parseISO(p.created_at), lastMonth)
      ).length;
      const adminGrowth =
        adminsLastMonth > 0
          ? ((admins.length - adminsLastMonth) / adminsLastMonth) * 100
          : 0;
      const scorers = profiles.filter((p) => p.role === "scorer");
      const players = profiles.filter(
        (p) => p.role === "player" || p.role === "viewer"
      );
      const completedTournaments = tournaments.filter(
        (t) => new Date(t.end_date) < now
      ).length;
      const liveMatches = matches.filter(
        (m) => m.status?.toLowerCase() === "live"
      ).length;

      setCounts({
        admins: admins.length,
        adminTrend: Math.round(adminGrowth),
        tournaments: tournaments.length,
        tournamentsCompleted: completedTournaments,
        liveMatches: liveMatches,
        scorers: scorers.length,
        players: players.length,
        teams: teams?.length || 0,
      });

      // Chart 1: Usage
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthKey = format(date, "MMM");
        const usersCreated = profiles.filter((p) =>
          isSameMonth(parseISO(p.created_at), date)
        ).length;
        const matchesCreated = matches.filter((m) =>
          isSameMonth(parseISO(m.created_at), date)
        ).length;
        months.push({
          date: monthKey,
          users: usersCreated,
          matches: matchesCreated,
        });
      }
      setUsageData(months);

      // Chart 2: Top Organizers
      const tourneyCounts: Record<string, number> = {};
      tournaments.forEach((t) => {
        tourneyCounts[t.user_id] = (tourneyCounts[t.user_id] || 0) + 1;
      });
      const topAdmins = Object.entries(tourneyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([userId, count]) => {
          const admin = profiles.find((p) => p.id === userId);
          return { admin: admin?.name || "Unknown", tournaments: count };
        });
      setAdminPerformance(topAdmins);

      // Subscriptions Breakdown
      const plans = { Basic: 0, Professional: 0, Enterprise: 0 };
      admins.forEach((a) => {
        const pType = a.plan_type?.toLowerCase() || "basic";
        if (pType.includes("pro")) plans.Professional++;
        else if (pType.includes("ent")) plans.Enterprise++;
        else plans.Basic++;
      });
      setSubscriptionCounts([
        { name: "Basic", value: plans.Basic, color: "#10b981" },
        { name: "Professional", value: plans.Professional, color: "#8b5cf6" },
        { name: "Enterprise", value: plans.Enterprise, color: "#f59e0b" },
      ]);

      // Activity Logs
      if (logs) {
        const formattedLogs = logs.map((log) => {
          let type = "info";
          if (log.action_type === "INSERT") type = "success";
          if (log.action_type === "DELETE") type = "error";
          if (log.entity_type === "MATCHES" && log.action_type === "UPDATE")
            type = "live";
          return {
            id: log.id,
            action: `${
              log.action_type === "INSERT"
                ? "New"
                : log.action_type === "DELETE"
                ? "Removed"
                : "Updated"
            } ${log.entity_type?.toLowerCase().slice(0, -1) || "item"}`,
            details: log.entity_name || "System Record",
            time: new Date(log.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: type,
          };
        });
        setRecentActivity(formattedLogs);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const getDotColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "live":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };

  const pieData = subscriptionCounts.filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* ROW 1: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Admins */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Admins</p>
                <p className="text-3xl text-gray-900 font-semibold">
                  {loading ? "-" : counts.admins}
                </p>
                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200 border">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {counts.adminTrend > 0 ? `+${counts.adminTrend}%` : "0%"} this
                  month
                </Badge>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Tournaments */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Tournaments</p>
                <p className="text-3xl text-gray-900 font-semibold">
                  {loading ? "-" : counts.tournaments}
                </p>
                <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200 border">
                  {counts.tournamentsCompleted} completed
                </Badge>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Live Matches */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Live Matches Now</p>
                <p className="text-3xl text-gray-900 font-semibold">
                  {loading ? "-" : counts.liveMatches}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {counts.liveMatches > 0 && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        counts.liveMatches > 0 ? "bg-red-600" : "bg-gray-400"
                      }`}
                    ></span>
                  </span>
                  <p className="text-xs text-gray-600 font-medium">
                    Broadcasting live
                  </p>
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  counts.liveMatches > 0 ? "bg-red-100" : "bg-gray-100"
                }`}
              >
                <Radio
                  className={`w-6 h-6 ${
                    counts.liveMatches > 0 ? "text-red-600" : "text-gray-400"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Scorers */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Scorers</p>
                <p className="text-3xl text-gray-900 font-semibold">
                  {loading ? "-" : counts.scorers}
                </p>
                <Badge className="mt-2 bg-indigo-100 text-indigo-700 border-indigo-200 border">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Ready to score
                </Badge>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: Players, Teams, Subscriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Players */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Players</p>
                <p className="text-3xl text-gray-900 font-semibold">
                  {loading ? "-" : counts.players}
                </p>
                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200 border">
                  <Activity className="w-3 h-3 mr-1" />
                  Registered
                </Badge>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Total Teams */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Teams</p>
                <p className="text-3xl text-gray-900 font-semibold">
                  {loading ? "-" : counts.teams}
                </p>
                <Badge className="mt-2 bg-orange-100 text-orange-700 border-orange-200 border">
                  Participating
                </Badge>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Shirt className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Subscription Text List */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <p className="text-sm text-gray-600 mb-3">
                  Subscription Overview
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  {subscriptionCounts.map((sub) => (
                    <div key={sub.name}>
                      <p className="text-3xl text-gray-900 font-semibold">
                        {sub.value}
                      </p>
                      <Badge
                        className="mt-1 font-normal"
                        style={{
                          backgroundColor: sub.color + "20",
                          color: sub.color,
                          border: `1px solid ${sub.color}40`,
                        }}
                      >
                        {sub.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex w-12 h-12 bg-yellow-100 rounded-xl items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: SWAPPED! (Pie Chart + Top Organizers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Subscription Pie Chart (Moved Up) */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Plan Distribution</CardTitle>
            <p className="text-sm text-gray-500">
              Active subscription breakdown
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RIGHT: Top Organizers (Bar Chart) */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Top Organizers</CardTitle>
            <p className="text-sm text-gray-500">
              Admins with most tournaments
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={adminPerformance}
                margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="admin"
                  stroke="#9ca3af"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#9ca3af"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar
                  dataKey="tournaments"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  name="Tournaments"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ROW 4: SWAPPED! (Line Chart + Activity Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Platform Usage Line Chart (Moved Down) */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Platform Usage</CardTitle>
            <p className="text-sm text-gray-500">
              New users vs. Matches created
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="New Users"
                />
                <Line
                  type="monotone"
                  dataKey="matches"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Matches"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RIGHT: Recent Activity */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Recent Platform Activity
            </CardTitle>
            <p className="text-sm text-gray-500">Latest system actions</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-gray-500 text-sm">Loading activity...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent logs found.</p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${getDotColor(
                          activity.type
                        )} shadow-sm`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                          Details:{" "}
                          <span className="text-gray-700">
                            {activity.details}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-4">
                      {activity.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
