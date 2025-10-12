import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, Trophy } from 'lucide-react';
import { Team } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface TeamStanding extends Team {
  matchesPlayed: number;
  won: number;
  lost: number;
  points: number;
  nrr: number;
}

interface PointsTablePageProps {
  teams: Team[];
}

export function PointsTablePage({ teams }: PointsTablePageProps) {
  // Mock standings data
  const standings: TeamStanding[] = teams.map((team, index) => ({
    ...team,
    matchesPlayed: 4,
    won: 4 - index,
    lost: index,
    points: (4 - index) * 2,
    nrr: (2.5 - index * 0.5).toFixed(2) as any,
  })).sort((a, b) => b.points - a.points);

  const handleExport = () => {
    // Mock CSV export
    alert('Exporting points table as CSV...');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-gray-900 mb-1">Points Table</h2>
          <p className="text-gray-600">Tournament standings and statistics</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>State Championship 2025 - Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">Matches Played</TableHead>
                  <TableHead className="text-center">Won</TableHead>
                  <TableHead className="text-center">Lost</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">NRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team, index) => (
                  <TableRow key={team.id} className={index === 0 ? 'bg-yellow-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={index === 0 ? '' : ''}>{index + 1}</span>
                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-600" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div>
                          <p>{team.name}</p>
                          <p className="text-sm text-gray-500">Captain: {team.captain}</p>
                        </div>
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
                        {team.nrr > 0 ? '+' : ''}{team.nrr}
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
