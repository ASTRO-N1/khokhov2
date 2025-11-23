import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  ArrowLeft,
  Trophy,
  Target,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Tournament, Team, Match, ScoringAction } from "../../types";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";

interface PlayerStatsPageProps {
  tournament: Tournament;
  teams: Team[];
  onBack: () => void;
}

interface PlayerStat {
  id: string;
  jerseyNumber: number;
  name: string;
  teamName: string;
  value: number;
}

export function PlayerStatsPage({
  tournament,
  teams,
  onBack,
}: PlayerStatsPageProps) {
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<ScoringAction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get all matches for this tournament to filter actions
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select("id, team_a_id, team_b_id")
          .eq("tournament_id", tournament.id);

        if (matchesError) throw matchesError;

        const matchIds = matchesData.map((m) => m.id);
        setMatches(matchesData as unknown as Match[]);

        if (matchIds.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Get all scoring actions for these matches
        const { data: actionsData, error: actionsError } = await supabase
          .from("scoring_actions")
          .select("*")
          .in("match_id", matchIds);

        if (actionsError) throw actionsError;

        // Map raw DB data to our ScoringAction type
        const formattedActions: ScoringAction[] = actionsData.map((a: any) => ({
          id: a.id,
          matchId: a.match_id,
          turn: a.turn,
          inning: a.inning,
          attackerJersey: a.attacker_jersey,
          attackerName: a.attacker_name,
          defenderJersey: a.defender_jersey,
          defenderName: a.defender_name,
          symbol: a.symbol,
          actionType: a.action_type,
          points: a.points,
          runTime: a.run_time,
          perTime: a.per_time,
          timestamp: a.created_at,
          scoringTeamId: a.scoring_team_id,
        }));

        setActions(formattedActions);
      } catch (error: any) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load player statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournament.id]);

  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };

  const { topAttackers, topDefenders, cardsSummary } = useMemo(() => {
    const attStats: Record<string, PlayerStat> = {};
    const defStats: Record<string, PlayerStat> = {};
    const cardStats: Record<string, PlayerStat> = {};

    actions.forEach((action) => {
      // Attacker Stats (Points)
      if (action.attackerName && action.attackerJersey) {
        const key = `${action.scoringTeamId}-${action.attackerJersey}`;
        if (!attStats[key]) {
          attStats[key] = {
            id: key,
            jerseyNumber: action.attackerJersey,
            name: action.attackerName,
            teamName: getTeamName(action.scoringTeamId),
            value: 0,
          };
        }
        attStats[key].value += action.points || 0;
      }

      // Defender Stats (Time on Court)
      if (action.defenderName && action.defenderJersey) {
        // Determine defending team ID
        const matchRef = matches.find((m) => m.id === action.matchId);
        let defendingTeamId = "";
        if (matchRef) {
          // If scoringTeamId is Team A, then Team B is defending
          const isTeamAScoring =
            action.scoringTeamId === (matchRef as any).team_a_id;
          defendingTeamId = isTeamAScoring
            ? (matchRef as any).team_b_id
            : (matchRef as any).team_a_id;
        }

        if (defendingTeamId) {
          const key = `${defendingTeamId}-${action.defenderJersey}`;
          if (!defStats[key]) {
            defStats[key] = {
              id: key,
              jerseyNumber: action.defenderJersey,
              name: action.defenderName,
              teamName: getTeamName(defendingTeamId),
              value: 0,
            };
          }
          // Accumulate perTime (survival duration)
          defStats[key].value += action.perTime || 0;
        }
      }

      // Cards Stats
      if (
        action.symbol === "yellow-card" ||
        action.symbol === "red-card" ||
        action.symbol === "warning"
      ) {
        // Determine who got the card
        const isDefender = !!action.defenderName;
        const name = isDefender ? action.defenderName : action.attackerName;
        const jersey = isDefender
          ? action.defenderJersey
          : action.attackerJersey;

        const matchRef = matches.find((m) => m.id === action.matchId);
        let teamId = action.scoringTeamId; // Default

        if (isDefender && matchRef) {
          // If defender got card, they belong to the defending team
          const isTeamAScoring =
            action.scoringTeamId === (matchRef as any).team_a_id;
          teamId = isTeamAScoring
            ? (matchRef as any).team_b_id
            : (matchRef as any).team_a_id;
        }

        if (name && jersey && teamId) {
          const key = `${teamId}-${jersey}`;
          if (!cardStats[key]) {
            cardStats[key] = {
              id: key,
              jerseyNumber: jersey,
              name: name,
              teamName: getTeamName(teamId),
              value: 0,
            };
          }
          cardStats[key].value += 1;
        }
      }
    });

    return {
      topAttackers: Object.values(attStats)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      topDefenders: Object.values(defStats)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      cardsSummary: Object.values(cardStats).sort((a, b) => b.value - a.value),
    };
  }, [actions, matches, teams]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPositionBadge = (position: number) => {
    if (position === 1)
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (position === 2) return "bg-gray-100 text-gray-700 border-gray-300";
    if (position === 3)
      return "bg-orange-100 text-orange-700 border-orange-300";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500">Crunching the numbers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white mb-1">Player Statistics</h1>
              <p className="text-blue-100">{tournament.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="attackers">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1">
          <TabsTrigger
            value="attackers"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Target className="w-4 h-4 mr-2" /> Top Attackers
          </TabsTrigger>
          <TabsTrigger
            value="defenders"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Shield className="w-4 h-4 mr-2" /> Top Defenders
          </TabsTrigger>
          <TabsTrigger
            value="cards"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <AlertCircle className="w-4 h-4 mr-2" /> Cards
          </TabsTrigger>
        </TabsList>

        {/* Attackers Tab */}
        <TabsContent value="attackers" className="mt-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" /> Top Attackers
                (Points)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topAttackers.length > 0 ? (
                <div className="space-y-3">
                  {topAttackers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Badge
                        className={`${getPositionBadge(
                          index + 1
                        )} border w-8 h-8 flex items-center justify-center text-sm rounded-full`}
                      >
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-gray-900 font-medium truncate">
                            {player.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className="bg-white text-gray-600 border-gray-200 text-xs"
                          >
                            #{player.jerseyNumber}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {player.teamName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {player.value}
                        </p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No attacking stats available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defenders Tab */}
        <TabsContent value="defenders" className="mt-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" /> Top Defenders
                (Time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topDefenders.length > 0 ? (
                <div className="space-y-3">
                  {topDefenders.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Badge
                        className={`${getPositionBadge(
                          index + 1
                        )} border w-8 h-8 flex items-center justify-center text-sm rounded-full`}
                      >
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-gray-900 font-medium truncate">
                            {player.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className="bg-white text-gray-600 border-gray-200 text-xs"
                          >
                            #{player.jerseyNumber}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {player.teamName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 font-mono">
                          {formatTime(player.value)}
                        </p>
                        <p className="text-xs text-gray-500">total time</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No defending stats available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="mt-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" /> Disciplinary
                Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cardsSummary.length > 0 ? (
                <div className="space-y-3">
                  {cardsSummary.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="bg-white text-yellow-700 border-yellow-300"
                        >
                          #{player.jerseyNumber}
                        </Badge>
                        <div>
                          <h4 className="text-gray-900 font-medium">
                            {player.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {player.teamName}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 border">
                        {player.value} {player.value === 1 ? "Card" : "Cards"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">
                    No cards have been issued in this tournament yet.
                  </p>
                  <p className="text-xs text-green-600 mt-1">Fair Play!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
