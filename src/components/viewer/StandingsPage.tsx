import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ArrowLeft, Trophy, TrendingUp, Medal } from "lucide-react";
import { Tournament, Team, Match } from "../../types";

interface StandingsPageProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  onBack: () => void;
}

interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  lost: number;
  draw: number;
  points: number;
  outsGiven: number; // Total points scored
  outsTaken: number; // Total points conceded
  scoreDifference: number;
  nrr: number; // Net Run Rate
}

export function StandingsPage({
  tournament,
  teams,
  matches,
  onBack,
}: StandingsPageProps) {
  // Calculate standings with NRR
  const calculateStandings = (): TeamStanding[] => {
    const standings: TeamStanding[] = teams.map((team) => {
      const teamMatches = matches.filter(
        (m) =>
          (m.teamA.id === team.id || m.teamB.id === team.id) &&
          m.status === "finished" &&
          m.tournamentId === tournament.id
      );

      let won = 0;
      let lost = 0;
      let draw = 0;
      let outsGiven = 0; // Points Scored
      let outsTaken = 0; // Points Conceded

      teamMatches.forEach((match) => {
        const isTeamA = match.teamA.id === team.id;
        const teamScore = isTeamA ? match.scoreA || 0 : match.scoreB || 0;
        const opponentScore = isTeamA ? match.scoreB || 0 : match.scoreA || 0;

        outsGiven += teamScore;
        outsTaken += opponentScore;

        if (teamScore > opponentScore) {
          won++;
        } else if (teamScore < opponentScore) {
          lost++;
        } else {
          draw++;
        }
      });

      const played = teamMatches.length;
      const points = won * 2 + draw * 1; // 2 for win, 1 for draw
      const scoreDifference = outsGiven - outsTaken;

      // NRR Calculation: (Total Points Scored / Matches Played) - (Total Points Conceded / Matches Played)
      const avgPointsScored = played > 0 ? outsGiven / played : 0;
      const avgPointsConceded = played > 0 ? outsTaken / played : 0;
      const nrr = avgPointsScored - avgPointsConceded;

      return {
        team,
        played,
        won,
        lost,
        draw,
        points,
        outsGiven,
        outsTaken,
        scoreDifference,
        nrr,
      };
    });

    // Sort by: Points -> NRR -> Score Diff
    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.nrr !== a.nrr) return b.nrr - a.nrr;
      return b.scoreDifference - a.scoreDifference;
    });
  };

  const standings = calculateStandings();

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full border-2 border-yellow-400">
          <Medal className="w-4 h-4 text-yellow-600" />
        </div>
      );
    } else if (position === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full border-2 border-gray-400">
          <Medal className="w-4 h-4 text-gray-600" />
        </div>
      );
    } else if (position === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full border-2 border-orange-400">
          <Medal className="w-4 h-4 text-orange-600" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-300">
          <span className="text-gray-600 font-bold">{position}</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white mb-1 font-bold text-2xl">
                Points Table
              </h1>
              <p className="text-blue-100">{tournament.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Highlight */}
      {standings.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {standings.slice(0, 3).map((standing, index) => (
            <Card
              key={standing.team.id}
              className={`border-2 transition-transform hover:scale-105 ${
                index === 0
                  ? "border-yellow-400 bg-yellow-50"
                  : index === 1
                  ? "border-gray-400 bg-gray-50"
                  : "border-orange-400 bg-orange-50"
              }`}
            >
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  {getPositionBadge(index + 1)}
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-1">
                  {standing.team.name}
                </h3>
                <p className="text-2xl text-gray-900 font-black mb-1">
                  {standing.points} pts
                </p>
                <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                  <span className="font-medium text-green-700">
                    W: {standing.won}
                  </span>
                  <span className="font-medium text-red-700">
                    L: {standing.lost}
                  </span>
                  <span>NRR: {standing.nrr.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Standings Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Full Standings</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Pos
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Team
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                    P
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                    W
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                    L
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                    D
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                    Pts
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                    NRR
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                    +/-
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr
                    key={standing.team.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index < 3 ? "bg-blue-50/10" : ""
                    }`}
                  >
                    <td className="py-3 px-4">{getPositionBadge(index + 1)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">
                          {standing.team.name}
                        </span>
                        {index === 0 && (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-900">
                      {standing.played}
                    </td>
                    <td className="py-3 px-2 text-center text-green-600 font-medium">
                      {standing.won}
                    </td>
                    <td className="py-3 px-2 text-center text-red-600">
                      {standing.lost}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {standing.draw}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge className="bg-blue-600 text-white px-3">
                        {standing.points}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-sm">
                      {standing.nrr > 0 ? "+" : ""}
                      {standing.nrr.toFixed(3)}
                    </td>
                    <td
                      className={`py-3 px-2 text-center font-medium ${
                        standing.scoreDifference > 0
                          ? "text-green-600"
                          : standing.scoreDifference < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {standing.scoreDifference > 0 ? "+" : ""}
                      {standing.scoreDifference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {standings.map((standing, index) => (
              <Card key={standing.team.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getPositionBadge(index + 1)}
                      <div>
                        <h4 className="text-gray-900 font-bold">
                          {standing.team.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {standing.played} matches
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-600 text-white mb-1">
                        {standing.points} pts
                      </Badge>
                      <p className="text-xs text-gray-500 font-mono">
                        NRR: {standing.nrr > 0 ? "+" : ""}
                        {standing.nrr.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm bg-gray-50 p-2 rounded-lg">
                    <div>
                      <p className="text-gray-500 text-xs uppercase">Won</p>
                      <p className="text-green-700 font-bold">{standing.won}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase">Lost</p>
                      <p className="text-red-700 font-bold">{standing.lost}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase">Draw</p>
                      <p className="text-gray-700 font-bold">{standing.draw}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase">Diff</p>
                      <p
                        className={
                          standing.scoreDifference > 0
                            ? "text-green-600 font-bold"
                            : standing.scoreDifference < 0
                            ? "text-red-600 font-bold"
                            : "text-gray-600 font-bold"
                        }
                      >
                        {standing.scoreDifference > 0 ? "+" : ""}
                        {standing.scoreDifference}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
