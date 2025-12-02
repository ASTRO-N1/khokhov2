import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Play,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { Match, Tournament } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";

export function MatchesPageEnhanced() {
  const navigate = useNavigate();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const tournamentsPromise = supabase
        .from("tournaments")
        .select("id, name");
      const matchesPromise = supabase
        .from("matches")
        .select(
          `id, match_number, match_datetime, venue, status, score_a, score_b, tournament_id, tournaments ( id, name ), team_a:teams!matches_team_a_id_fkey ( id, name, captain_name ), team_b:teams!matches_team_b_id_fkey ( id, name, captain_name )`
        )
        .order("match_datetime", { ascending: false });

      const [tournamentsResult, matchesResult] = await Promise.all([
        tournamentsPromise,
        matchesPromise,
      ]);

      if (tournamentsResult.error) {
        toast.error(
          `Error fetching tournaments: ${tournamentsResult.error.message}`
        );
      } else if (tournamentsResult.data) {
        setTournaments(tournamentsResult.data as Tournament[]);
      }

      if (matchesResult.error) {
        toast.error(`Error fetching matches: ${matchesResult.error.message}`);
      } else if (matchesResult.data) {
        const formattedMatches: Match[] = matchesResult.data.map((m: any) => ({
          id: m.id,
          matchNumber: m.match_number || `M-${m.id.substring(0, 4)}`,
          tournamentId: m.tournament_id,
          tournamentName: m.tournaments.name,
          teamA: {
            id: m.team_a.id,
            name: m.team_a.name,
            captain: m.team_a.captain_name,
            players: [],
          },
          teamB: {
            id: m.team_b.id,
            name: m.team_b.name,
            captain: m.team_b.captain_name,
            players: [],
          },
          dateTime: m.match_datetime,
          venue: m.venue,
          status: m.status,
          scoreA: m.score_a,
          scoreB: m.score_b,
        }));
        setAllMatches(formattedMatches);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchToDelete.id);

    if (error) {
      toast.error(`Failed to delete match: ${error.message}`);
    } else {
      toast.success(`Match ${matchToDelete.matchNumber} deleted.`);
      // Refetch matches for the selected tournament
      const { data, error: refetchError } = await supabase
        .from("matches")
        .select(
          `id, match_number, match_datetime, venue, status, score_a, score_b, tournament_id, tournaments ( id, name ), team_a:teams!matches_team_a_id_fkey ( id, name, captain_name ), team_b:teams!matches_team_b_id_fkey ( id, name, captain_name )`
        )
        .order("match_datetime", { ascending: false });

      if (refetchError) {
        toast.error("Failed to refresh matches list.");
      } else if (data) {
        const formattedMatches: Match[] = data.map((m: any) => ({
          id: m.id,
          matchNumber: m.match_number || `M-${m.id.substring(0, 4)}`,
          tournamentId: m.tournament_id,
          tournamentName: m.tournaments.name,
          teamA: {
            id: m.team_a.id,
            name: m.team_a.name,
            captain: m.team_a.captain_name,
            players: [],
          },
          teamB: {
            id: m.team_b.id,
            name: m.team_b.name,
            captain: m.team_b.captain_name,
            players: [],
          },
          dateTime: m.match_datetime,
          venue: m.venue,
          status: m.status,
          scoreA: m.score_a,
          scoreB: m.score_b,
        }));
        setAllMatches(formattedMatches);
      }
    }
    setMatchToDelete(null);
  };

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

  const matchesForSelectedTournament = allMatches.filter(
    (m) => m.tournamentId === selectedTournamentId
  );

  const filteredMatches = matchesForSelectedTournament.filter(
    (m) =>
      (m.teamA?.name?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
      (m.teamB?.name?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
      (m.matchNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const liveMatches = filteredMatches.filter((m) => m.status === "live");
  const upcomingMatches = filteredMatches.filter(
    (m) => m.status === "upcoming"
  );
  const finishedMatches = filteredMatches.filter(
    (m) => m.status === "finished"
  );

  const MatchCard = ({ match }: { match: Match }) => (
    <Card className="hover:shadow-xl transition-all border-l-4 border-blue-600">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{match.tournamentName}</p>
              <h3 className="text-gray-900">{match.matchNumber}</h3>
            </div>
            {getStatusBadge(match.status)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  {match.teamA.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm">{match.teamA.name}</p>
                  <p className="text-xs text-gray-500">
                    Captain: {match.teamA.captain}
                  </p>
                </div>
              </div>
              {match.scoreA !== undefined && (
                <p className="text-xl">{match.scoreA}</p>
              )}
            </div>
            <div className="text-center text-sm text-gray-500">vs</div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white">
                  {match.teamB.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm">{match.teamB.name}</p>
                  <p className="text-xs text-gray-500">
                    Captain: {match.teamB.captain}
                  </p>
                </div>
              </div>
              {match.scoreB !== undefined && (
                <p className="text-xl">{match.scoreB}</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
            <div>
              <p>{new Date(match.dateTime).toLocaleDateString()}</p>
              <p>{new Date(match.dateTime).toLocaleTimeString()}</p>
            </div>
            <div className="text-right">
              <p>{match.venue}</p>
              <p className="text-xs">{match.scorerName || "No scorer"}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {match.status === "live" && (
              <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                <Play className="w-4 h-4 mr-2" />
                Watch Live
              </Button>
            )}
            {/* Start Button Removed Here */}
            {match.status === "finished" && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => navigate(`/admin/results/match/${match.id}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            )}
            <Button
              onClick={() => navigate(`/admin/matches/edit/${match.id}`)}
              variant="outline"
              size="sm"
              className={match.status === "upcoming" ? "flex-1" : ""} // Make edit button full width if it's the main action
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setMatchToDelete(match)}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
          <Play className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-white mb-1">Match Management</h2>
            <p className="text-blue-100">View and manage all matches</p>
          </div>
          <Button
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-md"
            onClick={() => navigate("/admin/matches/create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Match
          </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label
              htmlFor="tournament-select"
              className="text-gray-700 flex items-center gap-2"
            >
              <Trophy className="w-5 h-5 text-blue-600" />
              Select a Tournament to View Matches
            </Label>
            <Select onValueChange={(value) => setSelectedTournamentId(value)}>
              <SelectTrigger
                id="tournament-select"
                className="border-gray-300 rounded-lg h-11"
              >
                <SelectValue placeholder="Choose a tournament..." />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedTournamentId && (
        <>
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search matches by team name or match number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 rounded-lg h-11"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <p>Loading matches...</p>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">
                  Upcoming
                  {upcomingMatches.length > 0 && (
                    <Badge className="ml-2 bg-blue-600">
                      {upcomingMatches.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="live">
                  Live
                  {liveMatches.length > 0 && (
                    <Badge className="ml-2 bg-red-600">
                      {liveMatches.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="finished">
                  Finished
                  {finishedMatches.length > 0 && (
                    <Badge className="ml-2 bg-green-600">
                      {finishedMatches.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                {upcomingMatches.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      No upcoming matches for this tournament.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="live">
                {liveMatches.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      No live matches for this tournament.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="finished">
                {finishedMatches.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      No finished matches for this tournament.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {finishedMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      <AlertDialog
        open={!!matchToDelete}
        onOpenChange={() => setMatchToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete match{" "}
              <span className="font-semibold text-gray-800">
                "{matchToDelete?.matchNumber}"
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMatch}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
