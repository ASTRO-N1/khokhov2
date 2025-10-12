import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { X, Trophy, Users, Target, Clock } from "lucide-react";
import { Match, ScoringAction } from "../../types";
import { MatchSetupData } from "./MatchSetupEnhanced";

interface ConsolidatedReportProps {
  match: Match;
  setupData: MatchSetupData;
  actions: ScoringAction[];
  onClose: () => void;
}

// Helper function to safely get integer value from snake_case or camelCase field
const getNumValue = (action: any, key: string): number => {
  // Check camelCase first, then snake_case
  const val =
    action[key] !== undefined
      ? action[key]
      : action[key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()];
  // Ensure it's treated as a number
  return typeof val === "number" ? val : parseInt(val) || 0;
};

// Helper to safely get string values for names/jerseys, handling snake_case
const getStringValue = (action: any, key: string): string | null => {
  const val =
    action[key] ||
    action[key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()];
  return typeof val === "string" && val ? val : null;
};

// Helper functions to safely access time and ID values
const getRunTime = (action: any): number => getNumValue(action, "runTime");
const getPerTime = (action: any): number => getNumValue(action, "perTime");
// FIX: Ensure we check both camelCase and snake_case for the scoring ID
const getScoringTeamId = (action: any): string | null =>
  action.scoringTeamId || action.scoring_team_id || null;

export function ConsolidatedReport({
  match,
  setupData,
  actions,
  onClose,
}: ConsolidatedReportProps) {
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // FIX: Calculate overall scores using the actual team IDs (UUIDs)
  const teamAScore = actions
    .filter((a) => getScoringTeamId(a) === match.teamA.id)
    .reduce((sum, a) => sum + a.points, 0);
  const teamBScore = actions
    .filter((a) => getScoringTeamId(a) === match.teamB.id)
    .reduce((sum, a) => sum + a.points, 0);

  // Determine winner based on calculated score
  const winnerName =
    teamAScore > teamBScore
      ? match.teamA.name
      : teamBScore > teamAScore
      ? match.teamB.name
      : "Draw";
  const winnerTeam =
    teamAScore > teamBScore ? "A" : teamBScore > teamAScore ? "B" : "Draw";

  // Get unique innings
  const innings = Array.from(new Set(actions.map((a) => a.inning))).sort(
    (a, b) => a - b
  );

  // Group actions by inning
  const actionsByInning = innings.map((inning) => ({
    inning,
    actions: actions.filter((a) => a.inning === inning),
  }));

  // Calculate statistics
  const totalOuts = actions.length;
  const totalTime =
    actions.length > 0 ? Math.max(...actions.map(getRunTime)) : 0;

  // Get top performers
  const attackerStats: {
    [key: string]: { name: string; points: number; outs: number };
  } = {};
  actions.forEach((action) => {
    const name = getStringValue(action, "attackerName");
    if (name) {
      if (!attackerStats[name]) {
        attackerStats[name] = { name, points: 0, outs: 0 };
      }
      attackerStats[name].points += getNumValue(action, "points");
      attackerStats[name].outs += 1;
    }
  });

  const topAttackers = Object.values(attackerStats)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const defenderStats: {
    [key: string]: {
      name: string;
      count: number;
      avgPerTime: number;
      totalPerTime: number;
    };
  } = {};
  actions.forEach((action) => {
    const name = getStringValue(action, "defenderName");
    if (name) {
      if (!defenderStats[name]) {
        defenderStats[name] = {
          name,
          count: 0,
          avgPerTime: 0,
          totalPerTime: 0,
        };
      }
      defenderStats[name].count += 1;
      defenderStats[name].totalPerTime += getPerTime(action);
    }
  });

  Object.values(defenderStats)
    .filter((d) => d.name)
    .forEach((stat) => {
      stat.avgPerTime = stat.totalPerTime / stat.count;
    });

  const topDefenders = Object.values(defenderStats)
    .filter((d) => d.name)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg flex items-center justify-between">
        <div>
          <h2 className="text-white mb-1">Match Consolidated Report</h2>
          <p className="text-blue-100">
            {match.matchNumber} - {match.tournamentName}
          </p>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* WINNER ANNOUNCEMENT (Visual integration from old design) */}

        {/* Match Summary */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Trophy className="w-5 h-5" />
              Match Statistics Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Total Outs</p>
                <p className="text-3xl text-blue-600">{totalOuts}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Total Time</p>
                <p className="text-3xl text-indigo-600">
                  {formatTime(totalTime)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Innings Played</p>
                <p className="text-3xl text-purple-600">{innings.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Average Per Time</p>
                <p className="text-3xl text-green-600">
                  {totalOuts > 0
                    ? formatTime(Math.floor(totalTime / totalOuts))
                    : "00:00"}
                </p>
              </div>
            </div>

            {/* Team Scores */}
            <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-2 text-center">
                  {match.teamA.name}
                </p>
                <p className="text-4xl text-blue-600 text-center">
                  {teamAScore}
                </p>
                <p className="text-xs text-blue-600 text-center mt-1">Points</p>
              </div>
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-sm text-red-700 mb-2 text-center">
                  {match.teamB.name}
                </p>
                <p className="text-4xl text-red-600 text-center">
                  {teamBScore}
                </p>
                <p className="text-xs text-red-600 text-center mt-1">Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Attackers */}
          <Card>
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Target className="w-5 h-5" />
                Top Attackers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {topAttackers.map((attacker, index) => (
                  <div
                    key={attacker.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-orange-600"
                            : "bg-blue-600"
                        }`}
                      >
                        #{index + 1}
                      </Badge>
                      <span className="text-gray-900">{attacker.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg text-green-600">
                        {attacker.points} pts
                      </p>
                      <p className="text-xs text-gray-500">
                        {attacker.outs} outs
                      </p>
                    </div>
                  </div>
                ))}
                {topAttackers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Defenders */}
          <Card>
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="w-5 h-5" />
                Top Defenders (Most Outs)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {topDefenders.map((defender, index) => (
                  <div
                    key={defender.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-orange-600"
                            : "bg-blue-600"
                        }`}
                      >
                        #{index + 1}
                      </Badge>
                      <span className="text-gray-900">{defender.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg text-blue-600">
                        {defender.count} outs
                      </p>
                      <p className="text-xs text-gray-500">
                        Avg: {formatTime(Math.floor(defender.avgPerTime))}
                      </p>
                    </div>
                  </div>
                ))}
                {topDefenders.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inning-wise Breakdown */}
        <Card>
          <CardHeader className="bg-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Clock className="w-5 h-5" />
              Inning-wise Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {actionsByInning.map(({ inning, actions: inningActions }) => (
                <div key={inning} className="border-l-4 border-indigo-600 pl-4">
                  <h4 className="text-gray-900 mb-3">Inning {inning}</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total Outs</p>
                      <p className="text-2xl text-gray-900">
                        {inningActions.length}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Time Taken</p>
                      <p className="text-2xl text-gray-900">
                        {inningActions.length > 0
                          ? formatTime(
                              Math.max(...inningActions.map(getRunTime))
                            )
                          : "00:00"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Avg Per Time</p>
                      <p className="text-2xl text-gray-900">
                        {inningActions.length > 0
                          ? formatTime(
                              Math.floor(
                                inningActions.reduce(
                                  (sum, a) => sum + getPerTime(a),
                                  0
                                ) / inningActions.length
                              )
                            )
                          : "00:00"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {actionsByInning.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No innings data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Complete Action Log */}
        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-gray-900">Complete Action Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 text-sm text-gray-600">#</th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Inning
                    </th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Turn
                    </th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Defender Jersey
                    </th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Defender Name
                    </th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Attacker Jersey
                    </th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Attacker Name
                    </th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Symbol
                    </th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Per Time
                    </th>
                    <th className="text-left p-3 text-sm text-gray-600">
                      Run Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((action, index) => (
                    <tr key={action.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-900">{index + 1}</td>
                      <td className="p-3">
                        <Badge variant="outline">{action.inning}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{action.turn}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 border-blue-300"
                        >
                          #{getNumValue(action, "defenderJersey")}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-900">
                        {getStringValue(action, "defenderName")}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="bg-red-50 border-red-300"
                        >
                          #{getNumValue(action, "attackerJersey")}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-900">
                        {getStringValue(action, "attackerName")}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {action.symbol}
                      </td>
                      <td className="p-3 font-mono text-blue-600">
                        {formatTime(getNumValue(action, "perTime"))}
                      </td>
                      <td className="p-3 font-mono text-gray-600">
                        {formatTime(getNumValue(action, "runTime"))}
                      </td>
                    </tr>
                  ))}
                  {actions.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="p-8 text-center text-gray-500"
                      >
                        No actions recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Close Button */}
        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Close Report
          </Button>
        </div>
      </div>
    </div>
  );
}
