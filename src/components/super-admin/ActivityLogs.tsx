import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Activity,
  User,
  Shield,
  Trash2,
  PlusCircle,
  AlertCircle,
  Search,
} from "lucide-react";
import { Input } from "../ui/input";
import { supabase } from "../../supabaseClient";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  user_id: string;
  admin_name?: string; // We will join this manually
  action_type: "INSERT" | "UPDATE" | "DELETE";
  entity_type: string;
  entity_name: string;
  created_at: string;
}

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLogs();

    // Real-time listener: If an admin does something while you are watching, it pops up!
    const channel = supabase
      .channel("activity_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        (payload) => {
          const newLog = payload.new as ActivityLog;
          // Ideally we fetch the name, but for live updates 'Unknown' is fine momentarily
          setLogs((prev) => [newLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    // 1. Fetch Logs
    const { data: logData, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50); // Hard limit to prevent UI crash

    if (error) {
      console.error("Error fetching logs", error);
    } else if (logData) {
      // 2. Fetch Admin Names (Manually join because Supabase doesn't support deep joins on Auth users easily)
      const userIds = [
        ...new Set(logData.map((log) => log.user_id).filter(Boolean)),
      ];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        nameMap[p.id] = p.name;
      });

      const enrichedLogs = logData.map((log) => ({
        ...log,
        admin_name: nameMap[log.user_id] || "Unknown Admin",
      }));

      setLogs(enrichedLogs);
    }
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "INSERT":
        return <PlusCircle className="w-4 h-4 text-green-500" />;
      case "DELETE":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case "UPDATE":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "INSERT":
        return "bg-green-100 text-green-800 border-green-200";
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-200";
      case "UPDATE":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-[600px] flex flex-col shadow-md border-gray-200">
      <CardHeader className="border-b bg-gray-50/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Shield className="w-5 h-5 text-blue-600" />
            System Activity Log
          </CardTitle>
          <Badge variant="outline" className="bg-white">
            Last 50 Actions
          </Badge>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by admin, action, or record..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading activity...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No recent activity found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-1 bg-white p-2 rounded-full border shadow-sm">
                    {getIcon(log.action_type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {log.admin_name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-5 border ${getActionColor(
                          log.action_type
                        )}`}
                      >
                        {log.action_type}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        {log.entity_type.replace(/_/g, " ")}:{" "}
                        <span className="font-medium text-gray-900">
                          {log.entity_name || "Unknown Item"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
