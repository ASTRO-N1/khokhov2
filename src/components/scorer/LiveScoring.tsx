import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Undo, Trash2, Play, Pause, CheckCircle } from 'lucide-react';
import { Match, ScoringAction, ActionType, Player } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface LiveScoringProps {
  match: Match;
  onBack: () => void;
}

export function LiveScoring({ match, onBack }: LiveScoringProps) {
  const [currentInning, setCurrentInning] = useState(1);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [attackingTeam, setAttackingTeam] = useState<'A' | 'B'>('A');
  const [scoreA, setScoreA] = useState(match.scoreA || 0);
  const [scoreB, setScoreB] = useState(match.scoreB || 0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(match.turnDuration || 540); // 9 minutes default
  const [actions, setActions] = useState<ScoringAction[]>([]);
  
  // Action input state
  const [attackerJersey, setAttackerJersey] = useState<number | null>(null);
  const [defenderJersey, setDefenderJersey] = useState<number | null>(null);
  const [actionType, setActionType] = useState<ActionType>('touch');

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = () => {
    const totalDuration = match.turnDuration || 540;
    const elapsed = totalDuration - timeRemaining;
    return formatTime(elapsed);
  };

  const calculatePoints = (action: ActionType): number => {
    switch (action) {
      case 'touch':
        return 1;
      case 'out':
        return 2;
      default:
        return 0;
    }
  };

  const recordAction = () => {
    if (!attackerJersey) return;

    const points = calculatePoints(actionType);
    const newAction: ScoringAction = {
      id: `action-${Date.now()}`,
      matchId: match.id,
      turn: currentTurn,
      inning: currentInning,
      attackerJersey: attackerJersey,
      defenderJersey: defenderJersey || undefined,
      actionType,
      points,
      timestamp: getElapsedTime(), // Use elapsed time from timer
      team: attackingTeam === 'A' ? 'attacker' : 'defender',
    };

    setActions([newAction, ...actions]);

    // Update scores
    if (attackingTeam === 'A') {
      setScoreA(prev => prev + points);
    } else {
      setScoreB(prev => prev + points);
    }

    // Clear inputs
    setAttackerJersey(null);
    setDefenderJersey(null);
  };

  const undoLastAction = () => {
    if (actions.length === 0) return;
    
    const lastAction = actions[0];
    setActions(actions.slice(1));

    // Revert score
    if (lastAction.team === 'attacker') {
      if (attackingTeam === 'A') {
        setScoreA(prev => prev - lastAction.points);
      } else {
        setScoreB(prev => prev - lastAction.points);
      }
    }
  };

  const clearTurn = () => {
    setActions([]);
    setAttackerJersey(null);
    setDefenderJersey(null);
  };

  const nextTurn = () => {
    setCurrentTurn(prev => prev + 1);
    setAttackingTeam(attackingTeam === 'A' ? 'B' : 'A');
    setTimeRemaining(match.turnDuration || 540);
    setTimerRunning(false);
    setActions([]);
  };

  const currentTeam = attackingTeam === 'A' ? match.teamA : match.teamB;
  const defendingTeam = attackingTeam === 'A' ? match.teamB : match.teamA;

  const actionButtons: { value: ActionType; label: string }[] = [
    { value: 'out', label: 'Out' },
    { value: 'kho', label: 'Kho' },
    { value: 'touch', label: 'Touch' },
    { value: 'foul', label: 'Foul' },
    { value: 'yellow', label: 'Yellow Card' },
    { value: 'red', label: 'Red Card' },
    { value: 'sub', label: 'Substitute' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Match Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-red-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-gray-600 mb-1">{match.matchNumber} - {match.tournamentName}</p>
              <h2 className="text-gray-900">{match.teamA.name} vs {match.teamB.name}</h2>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
              <p className="text-gray-600">Inning {currentInning}/{match.innings || 4}</p>
              <p className="text-gray-600">Turn {currentTurn}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Scoreboard and Timer - Made smaller */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className={attackingTeam === 'A' ? 'ring-2 ring-blue-600' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{match.teamA.name}</p>
                <p className="text-gray-900">{scoreA} Points</p>
              </div>
              {attackingTeam === 'A' && (
                <Badge className="bg-blue-600">Attacking</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={attackingTeam === 'B' ? 'ring-2 ring-red-600' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{match.teamB.name}</p>
                <p className="text-gray-900">{scoreB} Points</p>
              </div>
              {attackingTeam === 'B' && (
                <Badge className="bg-red-600">Attacking</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timer - Made smaller */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2">
              <p className={`text-gray-900 ${timeRemaining < 60 ? 'text-red-600' : ''}`}>
                {formatTime(timeRemaining)}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setTimerRunning(!timerRunning)}
                  variant={timerRunning ? 'outline' : 'default'}
                  className={!timerRunning ? 'bg-green-600 hover:bg-green-700' : ''}
                  size="sm"
                >
                  {timerRunning ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setTimeRemaining(match.turnDuration || 540)}
                  variant="outline"
                  size="sm"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Input - New Grid Layout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Action Input</CardTitle>
          <p className="text-gray-600 text-sm">
            Current: {currentTeam.name} (Attacker) vs {defendingTeam.name} (Defender)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Attackers */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <h3 className="text-sm">Attackers - {currentTeam.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {currentTeam.players.map((player: Player) => (
                  <button
                    key={player.id}
                    onClick={() => setAttackerJersey(player.jerseyNumber)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      attackerJersey === player.jerseyNumber
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-sm text-gray-500">#{player.jerseyNumber}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Defenders */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <h3 className="text-sm">Defenders - {defendingTeam.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {defendingTeam.players.map((player: Player) => (
                  <button
                    key={player.id}
                    onClick={() => setDefenderJersey(player.jerseyNumber)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      defenderJersey === player.jerseyNumber
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-sm text-gray-500">#{player.jerseyNumber}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-sm mb-3">Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {actionButtons.map((action) => (
                  <button
                    key={action.value}
                    onClick={() => setActionType(action.value)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      actionType === action.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-sm">{action.label}</div>
                  </button>
                ))}
              </div>
              <Button
                onClick={recordAction}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-3"
                disabled={!attackerJersey}
              >
                Record Action
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={undoLastAction} variant="outline" disabled={actions.length === 0}>
          <Undo className="w-4 h-4 mr-2" />
          Undo Last
        </Button>
        <Button onClick={clearTurn} variant="outline">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Turn
        </Button>
        <Button onClick={nextTurn} className="bg-green-600 hover:bg-green-700">
          Next Turn
        </Button>
        <Button onClick={onBack} className="ml-auto bg-blue-600 hover:bg-blue-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          End Match
        </Button>
      </div>

      {/* Scoresheet */}
      <Card>
        <CardHeader>
          <CardTitle>Live Scoresheet - Turn {currentTurn}</CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Turn</TableHead>
                    <TableHead>Attacker #</TableHead>
                    <TableHead>Defender #</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>{action.timestamp}</TableCell>
                      <TableCell>{action.turn}</TableCell>
                      <TableCell>{action.attackerJersey}</TableCell>
                      <TableCell>{action.defenderJersey || '-'}</TableCell>
                      <TableCell className="capitalize">{action.actionType}</TableCell>
                      <TableCell>{action.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No actions recorded yet. Start scoring to see the live scoresheet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}