import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Match } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface MatchesPageProps {
  matches: Match[];
}

export function MatchesPage({ matches }: MatchesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="destructive" className="animate-pulse">Live</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-600">Upcoming</Badge>;
      case 'finished':
        return <Badge variant="secondary">Finished</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredMatches = matches.filter(match =>
    match.matchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.teamA.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.teamB.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.tournamentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-gray-900 mb-1">Match Management</h2>
          <p className="text-gray-600">Create and manage tournament matches</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Match
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match No.</TableHead>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Scorer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">{match.matchNumber}</TableCell>
                    <TableCell>{match.tournamentName}</TableCell>
                    <TableCell>
                      <div>
                        <p>{match.teamA.name}</p>
                        <p className="text-gray-500">vs</p>
                        <p>{match.teamB.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(match.dateTime).toLocaleString()}
                    </TableCell>
                    <TableCell>{match.venue}</TableCell>
                    <TableCell>{match.scorerName || 'Not Assigned'}</TableCell>
                    <TableCell>{getStatusBadge(match.status)}</TableCell>
                    <TableCell>
                      {match.scoreA !== undefined && match.scoreB !== undefined
                        ? `${match.scoreA} - ${match.scoreB}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
