import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, Trophy, Download } from 'lucide-react';
import { Tournament, Match, Team } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface TournamentDetailsPageProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  onBack: () => void;
}

interface TeamStanding extends Team {
  matchesPlayed: number;
  won: number;
  lost: number;
  points: number;
  nrr: number;
}

export function TournamentDetailsPage({ tournament, matches, teams, onBack }: TournamentDetailsPageProps) {
  // Filter matches for this tournament
  const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
  
  // Mock standings data for this tournament
  const standings: TeamStanding[] = teams.map((team, index) => ({
    ...team,
    matchesPlayed: 3,
    won: 3 - index,
    lost: index,
    points: (3 - index) * 2,
    nrr: (2.0 - index * 0.5),
  })).sort((a, b) => b.points - a.points);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="destructive" className="animate-pulse">Live</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-600">Upcoming</Badge>;
      case 'finished':
        return <Badge className="bg-green-600">Finished</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-gray-900">{tournament.name}</h2>
          <p className="text-gray-600">Tournament Details & Statistics</p>
        </div>
      </div>

      {/* Tournament Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Tournament Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tournament Type</p>
              <Badge variant="outline" className="text-sm">
                {tournament.type}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <Badge className={
                tournament.status === 'ongoing' ? 'bg-green-600' :
                tournament.status === 'upcoming' ? 'bg-blue-600' :
                'bg-gray-600'
              }>
                {tournament.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-sm">
                  {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-sm">{tournament.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Teams</p>
                <p className="text-sm">{teams.length} Registered</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Matches</p>
                <p className="text-sm">{tournamentMatches.length} Scheduled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Under This Tournament */}
      <Card>
        <CardHeader>
          <CardTitle>Matches ({tournamentMatches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tournamentMatches.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No matches scheduled yet</p>
          ) : (
            <div className="space-y-3">
              {tournamentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(match.status)}
                      <span className="text-sm text-gray-600">{match.matchNumber}</span>
                    </div>
                    <p className="text-sm mb-1">
                      {match.teamA.name} vs {match.teamB.name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(match.dateTime).toLocaleDateString()}</span>
                      <span>{new Date(match.dateTime).toLocaleTimeString()}</span>
                      <span>{match.venue}</span>
                    </div>
                  </div>
                  {match.status === 'finished' && (
                    <div className="mt-2 sm:mt-0 text-right">
                      <p className="text-sm">
                        {match.scoreA} - {match.scoreB}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Participating */}
      <Card>
        <CardHeader>
          <CardTitle>Participating Teams ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  {team.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm">{team.name}</p>
                  <p className="text-xs text-gray-500">Captain: {team.captain}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Points Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Points Table</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">Played</TableHead>
                  <TableHead className="text-center">Won</TableHead>
                  <TableHead className="text-center">Lost</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">NRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team, index) => (
                  <TableRow key={team.id} className={index === 0 ? 'bg-yellow-50' : ''}>
                    <TableCell className="text-center">
                      {index === 0 && <Trophy className="w-4 h-4 text-yellow-600 inline mr-1" />}
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{team.name}</p>
                        <p className="text-xs text-gray-500">Captain: {team.captain}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{team.matchesPlayed}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-600">{team.won}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{team.lost}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{team.points}</TableCell>
                    <TableCell className="text-center">
                      <span className={team.nrr > 0 ? 'text-green-600' : 'text-red-600'}>
                        {team.nrr > 0 ? '+' : ''}{team.nrr.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm mb-2">Points System</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Win: 2 points</li>
              <li>• Loss: 0 points</li>
              <li>• NRR: Net Run Rate (calculated based on scoring rate)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
