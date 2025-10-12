import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Search, Eye, CheckCircle } from "lucide-react";
import { Match } from "../../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface ResultsPageProps {
  matches: Match[];
  onViewResult: (matchId: string) => void;
}

export function ResultsPage({ matches, onViewResult }: ResultsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMatches = matches.filter(
    (match) =>
      match.matchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.teamA.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.teamB.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.tournamentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
          <CheckCircle className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10">
          <h2 className="text-white mb-1">Results & Verification</h2>
          <p className="text-blue-100">Review and verify match results</p>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search finished matches by match number, team, or tournament..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 rounded-lg h-11"
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
                  <TableHead>Final Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">
                      {match.matchNumber}
                    </TableCell>
                    <TableCell>{match.tournamentName}</TableCell>
                    <TableCell>
                      <div>
                        <p>{match.teamA.name}</p>
                        <p className="text-gray-500">vs</p>
                        <p>{match.teamB.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p
                          className={
                            match.scoreA! > match.scoreB! ? "" : "text-gray-500"
                          }
                        >
                          {match.teamA.name}: {match.scoreA}
                        </p>
                        <p
                          className={
                            match.scoreB! > match.scoreA! ? "" : "text-gray-500"
                          }
                        >
                          {match.teamB.name}: {match.scoreB}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(match.dateTime).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewResult(match.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Result
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
