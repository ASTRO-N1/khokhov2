import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  ArrowLeft,
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Shield,
  MapPin,
} from "lucide-react";
import { Team, Match } from "../../types";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";

interface TeamPageProps {
  team: Team;
  matches?: Match[];
  onBack: () => void;
}

export function TeamPage({ team, matches = [], onBack }: TeamPageProps) {
  const [playerStats, setPlayerStats] = useState<
    Record<number, { points: number; time: number }>
  >({});
  const [loadingStats, setLoadingStats] = useState(true);

  // 1. Calculate Match Stats
  const teamMatches = matches.filter(
    (m) => m.teamA.id === team.id || m.teamB.id === team.id
  );
  const upcomingMatches = teamMatches.filter((m) => m.status === "upcoming");
  const finishedMatches = teamMatches.filter((m) => m.status === "finished");

  const played = finishedMatches.length;
  const wins = finishedMatches.filter((m) => {
    if (m.teamA.id === team.id) return (m.scoreA || 0) > (m.scoreB || 0);
    return (m.scoreB || 0) > (m.scoreA || 0);
  }).length;
  const losses = played - wins;

  // 2. Fetch Player Performance Data
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (teamMatches.length === 0) {
        setLoadingStats(false);
        return;
      }

      const matchIds = teamMatches.map((m) => m.id);

      const { data, error } = await supabase
        .from("scoring_actions")
        .select("*")
        .in("match_id", matchIds);

      if (error) {
        console.error("Error fetching stats:", error);
        toast.error("Could not load player stats");
        setLoadingStats(false);
        return;
      }

      const stats: Record<number, { points: number; time: number }> = {};

      data.forEach((action: any) => {
        // Points (Attacker)
        // We check if the action belongs to THIS team's attacker
        // (Since scoring_team_id is usually the attacking team for points)
        if (action.scoring_team_id === team.id && action.attacker_jersey) {
          const jersey = action.attacker_jersey;
          if (!stats[jersey]) stats[jersey] = { points: 0, time: 0 };
          stats[jersey].points += action.points || 0;
        }

        // Time (Defender)
        // We check if the defender belongs to THIS team.
        // If scoring_team_id is the OPPONENT, then the defender is ours.
        if (action.scoring_team_id !== team.id && action.defender_jersey) {
          const jersey = action.defender_jersey;
          if (!stats[jersey]) stats[jersey] = { points: 0, time: 0 };
          stats[jersey].time += action.per_time || 0;
        }
      });

      setPlayerStats(stats);
      setLoadingStats(false);
    };

    fetchPlayerStats();
  }, [team.id, teamMatches.length]); // Re-run if matches change

  // 3. Determine Top Players
  const topScorerJersey = useMemo(() => {
    let max = -1;
    let jersey = -1;
    Object.entries(playerStats).forEach(([j, s]) => {
      if (s.points > max) {
        max = s.points;
        jersey = parseInt(j);
      }
    });
    return max > 0 ? jersey : -1;
  }, [playerStats]);

  const topDefenderJersey = useMemo(() => {
    let max = -1;
    let jersey = -1;
    Object.entries(playerStats).forEach(([j, s]) => {
      if (s.time > max) {
        max = s.time;
        jersey = parseInt(j);
      }
    });
    return max > 0 ? jersey : -1;
  }, [playerStats]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Team Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold mb-1">
                {team.name}
              </h1>
              <p className="text-blue-100">Captain: {team.captain}</p>
              {team.coach && (
                <p className="text-blue-100 text-sm">Coach: {team.coach}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Played</p>
                <p className="text-2xl text-gray-900 font-bold mt-1">
                  {played}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Won</p>
                <p className="text-2xl text-green-600 font-bold mt-1">{wins}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lost</p>
                <p className="text-2xl text-red-600 font-bold mt-1">{losses}</p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Roster with Stats */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Team Roster</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            {team.players.map((player) => {
              const stats = playerStats[player.jerseyNumber] || {
                points: 0,
                time: 0,
              };
              const isTopScorer = player.jerseyNumber === topScorerJersey;
              const isTopDefender = player.jerseyNumber === topDefenderJersey;

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="bg-white text-blue-700 border-blue-200 w-8 justify-center"
                    >
                      {player.jerseyNumber}
                    </Badge>
                    <div>
                      <span className="text-gray-900 font-medium block">
                        {player.name}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {player.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {/* Special Badges */}
                    {isTopScorer && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        Top Scorer
                      </Badge>
                    )}
                    {isTopDefender && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        Iron Defender
                      </Badge>
                    )}
                    {player.isCaptain && (
                      <Badge
                        variant="outline"
                        className="border-yellow-400 text-yellow-700"
                      >
                        C
                      </Badge>
                    )}

                    {/* Stats */}
                    {!loadingStats && (
                      <div className="flex gap-4 text-right">
                        <div className="w-16">
                          <p className="text-xs text-gray-400">Points</p>
                          <p className="font-bold text-gray-700">
                            {stats.points}
                          </p>
                        </div>
                        <div className="w-20">
                          <p className="text-xs text-gray-400">Defend Time</p>
                          <p className="font-bold text-gray-700">
                            {formatTime(stats.time)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Upcoming Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium mb-1">
                      {match.teamA.name} vs {match.teamB.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(match.dateTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {match.venue}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
                    {match.matchNumber}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
