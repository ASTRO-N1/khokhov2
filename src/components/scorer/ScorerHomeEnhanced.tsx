import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Calendar,
  MapPin,
  Play,
  Clock,
  Trophy,
  Target,
  CheckCircle,
} from "lucide-react";
import { Match, User as UserType, Team } from "../../types";
import { ViewResultModal } from "./ViewResultModal";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ScorerHomeEnhancedProps {
  user: UserType;
  onStartMatch: (match: Match) => void;
}

export function ScorerHomeEnhanced({
  user,
  onStartMatch,
}: ScorerHomeEnhancedProps) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFinishedMatch, setSelectedFinishedMatch] =
    useState<Match | null>(null);

  // --- 1. Auto-Resume Logic (The Fix for Refresh Crash) ---
  useEffect(() => {
    const checkSavedSession = () => {
      const saved = localStorage.getItem("activeMatchSetup");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          // Check if data is fresh (less than 24 hours old)
          const oneDay = 24 * 60 * 60 * 1000;
          if (Date.now() - parsed.timestamp > oneDay) {
            localStorage.removeItem("activeMatchSetup");
            return;
          }

          // If we have a live match saved, resume immediately
          if (parsed.status === "live" && parsed.match) {
            console.log("Restoring active match from crash/refresh...");
            toast.success("Resuming previous session...");
            onStartMatch(parsed.match);
          }
        } catch (e) {
          console.error("Failed to restore match", e);
          localStorage.removeItem("activeMatchSetup");
        }
      }
    };

    // Small delay ensures parent components are fully mounted before redirecting
    const timer = setTimeout(checkSavedSession, 100);
    return () => clearTimeout(timer);
  }, [onStartMatch]);
  // ----------------------------------------------------------

  useEffect(() => {
    const fetchAssignedMatches = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          id,
          match_number,
          match_datetime,
          venue,
          status,
          score_a,
          score_b,
          turn_duration,
          tournament:tournaments(name),
          team_a:teams!matches_team_a_id_fkey (id, name, captain_name, players!team_id(id, name, jersey_number)),
          team_b:teams!matches_team_b_id_fkey (id, name, captain_name, players!team_id(id, name, jersey_number))
        `
        )
        .eq("scorer_id", user.id)
        .order("match_datetime", { ascending: true });

      if (error) {
        toast.error("Failed to fetch assigned matches: " + error.message);
      } else if (data) {
        const formattedMatches: Match[] = data.map((m: any) => ({
          id: m.id,
          matchNumber: m.match_number,
          tournamentName: m.tournament.name,
          teamA: {
            id: m.team_a.id,
            name: m.team_a.name,
            captain: m.team_a.captain_name,
            players: m.team_a.players.map((p: any) => ({
              ...p,
              jerseyNumber: p.jersey_number,
            })),
          } as Team,
          teamB: {
            id: m.team_b.id,
            name: m.team_b.name,
            captain: m.team_b.captain_name,
            players: m.team_b.players.map((p: any) => ({
              ...p,
              jerseyNumber: p.jersey_number,
            })),
          } as Team,
          dateTime: m.match_datetime,
          venue: m.venue,
          status: m.status,
          scorerId: user.id,
          scorerName: user.name,
          scoreA: m.score_a,
          scoreB: m.score_b,
          turnDuration: m.turn_duration,
        }));
        setMatches(formattedMatches);
      }
      setLoading(false);
    };

    fetchAssignedMatches();
  }, [user]);

  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const liveMatches = matches.filter((m) => m.status === "live");
  const finishedMatches = matches.filter((m) => m.status === "finished");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <Badge variant="destructive" className="animate-pulse">
            Live
          </Badge>
        );
      case "upcoming":
        return <Badge className="bg-blue-600">Upcoming</Badge>;
      case "finished":
        return <Badge className="bg-green-600">Finished</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <Card className="hover:shadow-xl transition-all">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {match.tournamentName}
              </p>
              <h3 className="text-gray-900">{match.matchNumber}</h3>
            </div>
            {getStatusBadge(match.status)}
          </div>

          {/* Teams */}
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                  A
                </div>
                <div>
                  <p className="text-gray-900 font-medium">
                    {match.teamA.name}
                  </p>
                  {match.scoreA !== undefined && (
                    <p className="text-sm text-blue-600">
                      {match.scoreA} points
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center text-gray-400 text-sm">
              vs
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg flex items-center justify-center text-white">
                  B
                </div>
                <div>
                  <p className="text-gray-900 font-medium">
                    {match.teamB.name}
                  </p>
                  {match.scoreB !== undefined && (
                    <p className="text-sm text-red-600">
                      {match.scoreB} points
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{new Date(match.dateTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{match.venue}</span>
            </div>
            {match.turnDuration && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{match.turnDuration / 60} minutes per turn</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {match.status === "upcoming" && (
            <Button
              onClick={() => onStartMatch(match)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Match
            </Button>
          )}
          {match.status === "live" && (
            <Button
              onClick={() => onStartMatch(match)}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
            >
              <Target className="w-4 h-4 mr-2" />
              Continue Scoring
            </Button>
          )}
          {match.status === "finished" && (
            <Button
              variant="outline"
              className="w-full hover:bg-green-50 hover:text-green-700 hover:border-green-400 transition-all"
              onClick={() => navigate(`/scorer/results/match/${match.id}`)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              View Results
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <p>Loading your assigned matches...</p>
      </div>
    );
  }

  return (
    <>
      {selectedFinishedMatch && (
        <ViewResultModal
          match={selectedFinishedMatch}
          onClose={() => setSelectedFinishedMatch(null)}
          actions={[]}
          setupData={undefined}
        />
      )}
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
            <Trophy className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-white mb-1">Allotted Matches</h2>
            <p className="text-blue-100">
              Manage and score your assigned matches
            </p>
          </div>
        </div>

        {/* Matches Tabs */}
        <Card className="shadow-lg border-t-4 border-blue-600">
          <Tabs defaultValue="upcoming" className="w-full">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-white to-blue-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-900">Your Matches</h3>
                  <p className="text-sm text-gray-600">
                    Select a category to view matches
                  </p>
                </div>
              </div>
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger
                  value="upcoming"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center gap-2 justify-center"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Upcoming</span>
                  <Badge className="bg-white/20 text-white data-[state=active]:bg-white data-[state=active]:text-blue-600 ml-1">
                    {upcomingMatches.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center gap-2 justify-center"
                >
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Live</span>
                  <Badge className="bg-white/20 text-white data-[state=active]:bg-white data-[state=active]:text-red-600 ml-1">
                    {liveMatches.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="finished"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 flex items-center gap-2 justify-center"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Finished</span>
                  <Badge className="bg-white/20 text-white data-[state=active]:bg-white data-[state=active]:text-green-600 ml-1">
                    {finishedMatches.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              <TabsContent value="upcoming" className="mt-0">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingMatches.length > 0 ? (
                    upcomingMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No upcoming matches assigned to you.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="live" className="mt-0">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {liveMatches.length > 0 ? (
                    liveMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No live matches assigned to you.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="finished" className="mt-0">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {finishedMatches.length > 0 ? (
                    finishedMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No finished matches assigned to you.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </>
  );
}
