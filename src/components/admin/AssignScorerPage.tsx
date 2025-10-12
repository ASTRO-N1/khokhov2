import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface Assignment {
  id: string;
  tournamentName: string;
  matchNumber: string;
  scorerName: string;
  dateTime: string;
}

export function AssignScorerPage() {
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedMatch, setSelectedMatch] = useState('');
  const [selectedScorer, setSelectedScorer] = useState('');

  // Mock data
  const tournaments = ['State Championship 2025', 'District League', 'Inter-College Tournament'];
  const matches = ['Match #1', 'Match #2', 'Match #3', 'Match #4'];
  const scorers = ['John Doe', 'Sarah Smith', 'Mike Johnson', 'Emily Davis'];

  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: '1',
      tournamentName: 'State Championship 2025',
      matchNumber: 'Match #1',
      scorerName: 'John Doe',
      dateTime: '2025-10-15 10:00 AM',
    },
    {
      id: '2',
      tournamentName: 'District League',
      matchNumber: 'Match #2',
      scorerName: 'Sarah Smith',
      dateTime: '2025-10-15 2:00 PM',
    },
  ]);

  const handleAssign = () => {
    if (!selectedTournament || !selectedMatch || !selectedScorer) {
      toast.error('Please select all fields');
      return;
    }

    const newAssignment: Assignment = {
      id: `${Date.now()}`,
      tournamentName: selectedTournament,
      matchNumber: selectedMatch,
      scorerName: selectedScorer,
      dateTime: new Date().toLocaleString(),
    };

    setAssignments([...assignments, newAssignment]);
    toast.success('Scorer assigned successfully!');
    
    // Reset form
    setSelectedTournament('');
    setSelectedMatch('');
    setSelectedScorer('');
  };

  const handleRemove = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
    toast.success('Assignment removed');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-1">Assign Scorer</h2>
        <p className="text-gray-600">Assign scorers to matches</p>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournament">Tournament</Label>
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger id="tournament">
                  <SelectValue placeholder="Select tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="match">Match</Label>
              <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                <SelectTrigger id="match">
                  <SelectValue placeholder="Select match" />
                </SelectTrigger>
                <SelectContent>
                  {matches.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scorer">Scorer</Label>
              <Select value={selectedScorer} onValueChange={setSelectedScorer}>
                <SelectTrigger id="scorer">
                  <SelectValue placeholder="Select scorer" />
                </SelectTrigger>
                <SelectContent>
                  {scorers.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleAssign} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Scorer</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.tournamentName}</TableCell>
                    <TableCell>{assignment.matchNumber}</TableCell>
                    <TableCell>{assignment.scorerName}</TableCell>
                    <TableCell>{assignment.dateTime}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-600">Assigned</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(assignment.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
