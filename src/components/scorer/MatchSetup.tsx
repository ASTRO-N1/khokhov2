import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { Match, Player } from '../../types';
import { Checkbox } from '../ui/checkbox';

interface MatchSetupProps {
  match: Match;
  onBack: () => void;
  onStartMatch: (setupData: MatchSetupData) => void;
}

export interface MatchSetupData {
  teamAPlaying: Player[];
  teamASubstitutes: Player[];
  teamBPlaying: Player[];
  teamBSubstitutes: Player[];
  tossWinner: 'A' | 'B';
  tossDecision: 'attack' | 'defend';
}

export function MatchSetup({ match, onBack, onStartMatch }: MatchSetupProps) {
  const [step, setStep] = useState<'team-a' | 'team-b' | 'preview'>('team-a');
  const [teamASelected, setTeamASelected] = useState<string[]>([]);
  const [teamBSelected, setTeamBSelected] = useState<string[]>([]);
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossDecision, setTossDecision] = useState<'attack' | 'defend'>('attack');

  const handlePlayerToggle = (playerId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if (teamASelected.includes(playerId)) {
        setTeamASelected(teamASelected.filter(id => id !== playerId));
      } else if (teamASelected.length < 7) {
        setTeamASelected([...teamASelected, playerId]);
      }
    } else {
      if (teamBSelected.includes(playerId)) {
        setTeamBSelected(teamBSelected.filter(id => id !== playerId));
      } else if (teamBSelected.length < 7) {
        setTeamBSelected([...teamBSelected, playerId]);
      }
    }
  };

  const handleNext = () => {
    if (step === 'team-a') {
      setStep('team-b');
    } else if (step === 'team-b') {
      setStep('preview');
    }
  };

  const handleBackStep = () => {
    if (step === 'team-b') {
      setStep('team-a');
    } else if (step === 'preview') {
      setStep('team-b');
    }
  };

  const handleStartMatch = () => {
    const teamAPlayingPlayers = match.teamA.players.filter(p => teamASelected.includes(p.id));
    const teamASubstitutes = match.teamA.players.filter(p => !teamASelected.includes(p.id));
    const teamBPlayingPlayers = match.teamB.players.filter(p => teamBSelected.includes(p.id));
    const teamBSubstitutes = match.teamB.players.filter(p => !teamBSelected.includes(p.id));

    const setupData: MatchSetupData = {
      teamAPlaying: teamAPlayingPlayers,
      teamASubstitutes: teamASubstitutes,
      teamBPlaying: teamBPlayingPlayers,
      teamBSubstitutes: teamBSubstitutes,
      tossWinner,
      tossDecision,
    };

    onStartMatch(setupData);
  };

  // Team A Selection
  if (step === 'team-a') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-gray-900">Match Setup</h2>
            <p className="text-gray-600">{match.matchNumber} - {match.tournamentName}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Playing 7 - {match.teamA.name}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Selected: {teamASelected.length}/7 players
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {match.teamA.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePlayerToggle(player.id, 'A')}
                >
                  <Checkbox
                    checked={teamASelected.includes(player.id)}
                    disabled={!teamASelected.includes(player.id) && teamASelected.length >= 7}
                  />
                  <div className="flex-1">
                    <p>{player.name}</p>
                    <p className="text-sm text-gray-500">Jersey #{player.jerseyNumber}</p>
                  </div>
                  {teamASelected.includes(player.id) && (
                    <Badge className="bg-blue-600">Playing</Badge>
                  )}
                  {!teamASelected.includes(player.id) && teamASelected.length >= 7 && (
                    <Badge variant="secondary">Substitute</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleNext}
                disabled={teamASelected.length !== 7}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next - {match.teamB.name}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Team B Selection
  if (step === 'team-b') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-gray-900">Match Setup</h2>
            <p className="text-gray-600">{match.matchNumber} - {match.tournamentName}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Playing 7 - {match.teamB.name}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Selected: {teamBSelected.length}/7 players
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {match.teamB.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePlayerToggle(player.id, 'B')}
                >
                  <Checkbox
                    checked={teamBSelected.includes(player.id)}
                    disabled={!teamBSelected.includes(player.id) && teamBSelected.length >= 7}
                  />
                  <div className="flex-1">
                    <p>{player.name}</p>
                    <p className="text-sm text-gray-500">Jersey #{player.jerseyNumber}</p>
                  </div>
                  {teamBSelected.includes(player.id) && (
                    <Badge className="bg-blue-600">Playing</Badge>
                  )}
                  {!teamBSelected.includes(player.id) && teamBSelected.length >= 7 && (
                    <Badge variant="secondary">Substitute</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handleBackStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={teamBSelected.length !== 7}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next - Preview
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preview
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBackStep}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-gray-900">Match Preview</h2>
          <p className="text-gray-600">{match.matchNumber} - {match.tournamentName}</p>
        </div>
      </div>

      {/* Team Lineups */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{match.teamA.name}</CardTitle>
            <p className="text-sm text-gray-600">Captain: {match.teamA.captain}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm mb-2">Playing 7</h3>
                <div className="space-y-2">
                  {match.teamA.players
                    .filter(p => teamASelected.includes(p.id))
                    .map(player => (
                      <div key={player.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">#{player.jerseyNumber}</Badge>
                        <span>{player.name}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm mb-2">Substitutes</h3>
                <div className="space-y-2">
                  {match.teamA.players
                    .filter(p => !teamASelected.includes(p.id))
                    .map(player => (
                      <div key={player.id} className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="secondary">#{player.jerseyNumber}</Badge>
                        <span>{player.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{match.teamB.name}</CardTitle>
            <p className="text-sm text-gray-600">Captain: {match.teamB.captain}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm mb-2">Playing 7</h3>
                <div className="space-y-2">
                  {match.teamB.players
                    .filter(p => teamBSelected.includes(p.id))
                    .map(player => (
                      <div key={player.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">#{player.jerseyNumber}</Badge>
                        <span>{player.name}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm mb-2">Substitutes</h3>
                <div className="space-y-2">
                  {match.teamB.players
                    .filter(p => !teamBSelected.includes(p.id))
                    .map(player => (
                      <div key={player.id} className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="secondary">#{player.jerseyNumber}</Badge>
                        <span>{player.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toss Details */}
      <Card>
        <CardHeader>
          <CardTitle>Toss Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Toss Winner</Label>
              <Select value={tossWinner} onValueChange={(value: 'A' | 'B') => setTossWinner(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">{match.teamA.name}</SelectItem>
                  <SelectItem value="B">{match.teamB.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={tossDecision} onValueChange={(value: 'attack' | 'defend') => setTossDecision(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attack">Attack</SelectItem>
                  <SelectItem value="defend">Defend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Match */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBackStep}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleStartMatch} className="bg-blue-600 hover:bg-blue-700">
          Start Match
        </Button>
      </div>
    </div>
  );
}
