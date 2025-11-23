import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Calendar,
  MapPin,
  Trophy,
  Search,
  Filter,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Match, Team } from "../../types";

interface ResultsPageProps {
  matches: Match[];
  teams: Team[];
  onViewMatch: (matchId: string) => void;
}

export function ResultsPage({ matches, teams, onViewMatch }: ResultsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Only show finished matches
  const finishedMatches = matches.filter((m) => m.status === "finished");

  // Filter matches
  const filteredMatches = finishedMatches.filter((match) => {
    const query = searchQuery.toLowerCase();
    const matchNum = match.matchNumber.toLowerCase();
    const tName = match.tournamentName.toLowerCase();
    const teamA = match.teamA.name.toLowerCase();
    const teamB = match.teamB.name.toLowerCase();

    const matchesSearch =
      searchQuery === "" ||
      teamA.includes(query) ||
      teamB.includes(query) ||
      matchNum.includes(query) ||
      tName.includes(query);

    const matchesTeam =
      selectedTeam === "all" ||
      match.teamA.id === selectedTeam ||
      match.teamB.id === selectedTeam;

    // Real Stage Filtering: Checks if match number contains the stage name
    const matchesStage =
      selectedStage === "all" ||
      matchNum.includes(selectedStage) ||
      (selectedStage === "group" && matchNum.includes("group")) ||
      (selectedStage === "league" && matchNum.includes("league"));

    return matchesSearch && matchesTeam && matchesStage;
  });

  const getWinnerBadge = (match: Match) => {
    const scoreA = match.scoreA || 0;
    const scoreB = match.scoreB || 0;

    if (scoreA > scoreB) {
      return {
        winner: match.teamA.name,
        color: "bg-green-100 text-green-700 border-green-200",
      };
    } else if (scoreB > scoreA) {
      return {
        winner: match.teamB.name,
        color: "bg-green-100 text-green-700 border-green-200",
      };
    } else {
      return {
        winner: "Draw",
        color: "bg-gray-100 text-gray-700 border-gray-200",
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2 font-bold text-2xl">
            Match Results
          </h1>
          <p className="text-gray-600">
            View completed match scoresheets and results
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Results</p>
                <p className="text-2xl text-gray-900 mt-1 font-bold">
                  {finishedMatches.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Teams</p>
                <p className="text-2xl text-gray-900 mt-1 font-bold">
                  {teams.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered</p>
                <p className="text-2xl text-gray-900 mt-1 font-bold">
                  {filteredMatches.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by team name or match number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team Filter */}
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger id="team" className="bg-white">
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stage Filter - Now Functional */}
              <div className="space-y-2">
                <Label htmlFor="stage">Stage (by Match Name)</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger id="stage" className="bg-white">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    <SelectItem value="group">Group Stage</SelectItem>
                    <SelectItem value="league">League Match</SelectItem>
                    <SelectItem value="quarter">Quarter Final</SelectItem>
                    <SelectItem value="semi">Semi Final</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedTeam("all");
                setSelectedStage("all");
              }}
              className="w-full"
            >
              Clear All Filters
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Results List */}
      <div className="space-y-4">
        {filteredMatches.map((match) => {
          const winnerInfo = getWinnerBadge(match);
          return (
            <Card
              key={match.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200"
              onClick={() => onViewMatch(match.id)}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Match {match.matchNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {match.tournamentName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${winnerInfo.color} border`}>
                      Winner: {winnerInfo.winner}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>

                {/* Score Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-gray-900 font-medium">
                      {match.teamA.name}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {match.scoreA || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-gray-900 font-medium">
                      {match.teamB.name}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {match.scoreB || 0}
                    </span>
                  </div>
                </div>

                {/* Match Info */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(match.dateTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {match.venue}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMatch(match.id);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Scoresheet
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredMatches.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No results found</p>
              <p className="text-sm text-gray-500">
                Try adjusting your filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
