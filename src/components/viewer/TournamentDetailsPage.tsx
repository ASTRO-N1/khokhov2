import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Users,
  Play,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Tournament, Match, Team } from "../../types";
import { StandingsPage } from "./StandingsPage"; // Import the Standings component

interface TournamentDetailsPageProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  onBack: () => void;
  onViewMatch: (matchId: string) => void;
  onViewTeam: (teamId: string) => void;
  onViewStandings: () => void; // Kept for compatibility, but we won't use it for the tab
}

export function TournamentDetailsPage({
  tournament,
  matches,
  teams,
  onBack,
  onViewMatch,
  onViewTeam,
}: TournamentDetailsPageProps) {
  const [activeTab, setActiveTab] = useState("fixtures");

  const tournamentMatches = matches;
  const liveMatches = tournamentMatches.filter(
    (m) => m.status?.toLowerCase() === "live"
  );
  const upcomingMatches = tournamentMatches.filter(
    (m) => m.status?.toLowerCase() === "upcoming"
  );
  const finishedMatches = tournamentMatches.filter(
    (m) => m.status?.toLowerCase() === "finished"
  );

  const getMatchStatusBadge = (status: Match["status"]) => {
    switch (status?.toLowerCase()) {
      case "live":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 border">
            <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-1 animate-pulse" />
            LIVE
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
            UPCOMING
          </Badge>
        );
      case "finished":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">
            FINISHED
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">
            {status}
          </Badge>
        );
    }
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200"
      onClick={() => onViewMatch(match.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Match {match.matchNumber}
            </span>
            {getMatchStatusBadge(match.status)}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">
              {match.teamA.name}
            </span>
            {match.status?.toLowerCase() !== "upcoming" && (
              <span className="text-gray-900 font-bold">{match.scoreA}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">
              {match.teamB.name}
            </span>
            {match.status?.toLowerCase() !== "upcoming" && (
              <span className="text-gray-900 font-bold">{match.scoreB}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(match.dateTime).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {match.venue}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TeamCard = ({ team }: { team: Team }) => (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200"
      onClick={() => onViewTeam(team.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold">{team.name}</h4>
              <p className="text-sm text-gray-500">Captain: {team.captain}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-600">
            {team.players.length} players
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tournaments
        </Button>

        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white text-2xl font-bold mb-1">
                    {tournament.name}
                  </h1>
                  <p className="text-blue-100">{tournament.type} Tournament</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <div>
                  <p className="text-xs text-blue-100">Duration</p>
                  <p className="text-sm">
                    {new Date(tournament.startDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                    {" - "}
                    {new Date(tournament.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <div>
                  <p className="text-xs text-blue-100">Location</p>
                  <p className="text-sm">{tournament.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <div>
                  <p className="text-xs text-blue-100">Teams</p>
                  <p className="text-sm">{teams.length} teams participating</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="fixtures" className="space-y-6 mt-6">
          {liveMatches.length > 0 && (
            <div>
              <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                Live Now
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          {upcomingMatches.length > 0 && (
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">
                Upcoming Matches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          {finishedMatches.length > 0 && (
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">
                Completed Matches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finishedMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          {tournamentMatches.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No matches scheduled yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="standings" className="mt-6">
          {/* Embedded Standings Page for Seamless UX */}
          <StandingsPage
            tournament={tournament}
            teams={teams}
            matches={matches}
            onBack={() => setActiveTab("fixtures")} // Back button goes to fixtures
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          <Card className="border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No announcements yet</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
