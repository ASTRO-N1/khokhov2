import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Pause, Play, RotateCcw, Edit2, AlertCircle } from 'lucide-react';
import { Match } from '../../types';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface LiveScoringEnhancedProps {
  match: Match;
  onBack: () => void;
}

interface ScoringAction {
  id: string;
  attacker: number;
  defender: number;
  symbol: string;
  symbolName: string;
  turn: number;
  inning: number;
  timestamp: string;
  preTime: string;
  runTime: string;
}

// Out types with symbols
const OUT_TYPES = [
  { symbol: 'S', name: 'Simple Touch', points: 1 },
  { symbol: 'SA', name: 'Sudden Attack', points: 2 },
  { symbol: 'L', name: 'Late Entry', points: 1 },
  { symbol: 'P', name: 'Pole Dive', points: 2 },
  { symbol: 'O', name: 'Out of Field', points: 1 },
  { symbol: 'D', name: 'Dive', points: 2 },
  { symbol: 'R', name: 'Retired', points: 0 },
  { symbol: 'W', name: 'Warning', points: 0 },
  { symbol: 'T', name: 'Tap', points: 1 },
  { symbol: '][', name: 'Turn Closure', points: 0 },
  { symbol: 'Y', name: 'Yellow Card', points: 0 },
  { symbol: 'F', name: 'Red Card', points: 0 },
];

export function LiveScoringEnhanced({ match, onBack }: LiveScoringEnhancedProps) {
  const [selectedAttacker, setSelectedAttacker] = useState<number | null>(null);
  const [selectedDefender, setSelectedDefender] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [actions, setActions] = useState<ScoringAction[]>([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentInning, setCurrentInning] = useState(1);
  const [turnTime, setTurnTime] = useState(540); // 9 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [showEndTurnDialog, setShowEndTurnDialog] = useState(false);
  const [showEndInningDialog, setShowEndInningDialog] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!isPaused && turnTime > 0) {
      const timer = setInterval(() => {
        setTurnTime(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, turnTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOut = () => {
    if (!selectedAttacker || !selectedDefender || !selectedSymbol) {
      toast.error('Please select Attacker, Defender, and Out Type');
      return;
    }

    const outType = OUT_TYPES.find(t => t.symbol === selectedSymbol);
    if (!outType) return;

    const newAction: ScoringAction = {
      id: Date.now().toString(),
      attacker: selectedAttacker,
      defender: selectedDefender,
      symbol: selectedSymbol,
      symbolName: outType.name,
      turn: currentTurn,
      inning: currentInning,
      timestamp: new Date().toLocaleTimeString(),
      preTime: formatTime(540 - turnTime),
      runTime: formatTime(turnTime),
    };

    setActions([newAction, ...actions]);

    // Update scores (simple logic - can be enhanced)
    if (currentTurn % 2 === 1) {
      setTeamAScore(prev => prev + outType.points);
    } else {
      setTeamBScore(prev => prev + outType.points);
    }

    // Reset selections
    setSelectedAttacker(null);
    setSelectedDefender(null);
    setSelectedSymbol(null);

    toast.success(`OUT recorded: ${outType.name}`);
  };

  const handleUndo = () => {
    if (actions.length === 0) {
      toast.error('No actions to undo');
      return;
    }

    const lastAction = actions[0];
    const outType = OUT_TYPES.find(t => t.symbol === lastAction.symbol);
    
    if (outType) {
      if (lastAction.turn % 2 === 1) {
        setTeamAScore(prev => Math.max(0, prev - outType.points));
      } else {
        setTeamBScore(prev => Math.max(0, prev - outType.points));
      }
    }

    setActions(actions.slice(1));
    toast.success('Last action undone');
  };

  const handleEndTurn = () => {
    setShowEndTurnDialog(true);
  };

  const confirmEndTurn = () => {
    setCurrentTurn(prev => prev + 1);
    setTurnTime(540);
    setIsPaused(false);
    setShowEndTurnDialog(false);
    toast.success(`Turn ${currentTurn} ended. Starting Turn ${currentTurn + 1}`);
  };

  const handleEndInning = () => {
    setShowEndInningDialog(true);
  };

  const confirmEndInning = () => {
    setCurrentInning(prev => prev + 1);
    setCurrentTurn(prev => prev + 1);
    setTurnTime(540);
    setIsPaused(false);
    setShowEndInningDialog(false);
    toast.success(`Inning ${currentInning} ended. Starting Inning ${currentInning + 1}`);
  };

  // Generate jersey numbers (1-15 for both teams)
  const teamAJerseys = Array.from({ length: 15 }, (_, i) => i + 1);
  const teamBJerseys = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Badge variant="destructive" className="animate-pulse px-4 py-2">
          LIVE
        </Badge>
      </div>

      {/* Score Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-red-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6 items-center">
            <div className="text-center">
              <p className="text-gray-600 mb-2">{match.teamA.name}</p>
              <p className="text-gray-900">{teamAScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Inning {currentInning} - Turn {currentTurn}</p>
              <p className="text-gray-900">{formatTime(turnTime)}</p>
              <div className="flex gap-2 justify-center mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-2">{match.teamB.name}</p>
              <p className="text-gray-900">{teamBScore}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Scoring Interface */}
      <Tabs defaultValue="scoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="actions">Actions ({actions.length})</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-6">
          {/* Three Grid System */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Attacker Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Attacker (Jersey No.)</CardTitle>
                <p className="text-xs text-gray-600">
                  {currentTurn % 2 === 1 ? match.teamA.name : match.teamB.name}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {(currentTurn % 2 === 1 ? teamAJerseys : teamBJerseys).map((num) => (
                    <Button
                      key={num}
                      variant={selectedAttacker === num ? 'default' : 'outline'}
                      className={`h-12 ${
                        selectedAttacker === num
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : ''
                      }`}
                      onClick={() => setSelectedAttacker(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Defender Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Defender (Jersey No.)</CardTitle>
                <p className="text-xs text-gray-600">
                  {currentTurn % 2 === 0 ? match.teamA.name : match.teamB.name}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {(currentTurn % 2 === 0 ? teamAJerseys : teamBJerseys).map((num) => (
                    <Button
                      key={num}
                      variant={selectedDefender === num ? 'default' : 'outline'}
                      className={`h-12 ${
                        selectedDefender === num
                          ? 'bg-red-600 hover:bg-red-700'
                          : ''
                      }`}
                      onClick={() => setSelectedDefender(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Symbol Grid (Out Types) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Out Type</CardTitle>
                <p className="text-xs text-gray-600">Select action type</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {OUT_TYPES.map((type) => (
                    <Button
                      key={type.symbol}
                      variant={selectedSymbol === type.symbol ? 'default' : 'outline'}
                      className={`h-12 text-xs ${
                        selectedSymbol === type.symbol
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : ''
                      }`}
                      onClick={() => setSelectedSymbol(type.symbol)}
                      title={type.name}
                    >
                      {type.symbol}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selection Display */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Attacker</p>
                    <Badge className="bg-blue-600">
                      {selectedAttacker || '-'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Defender</p>
                    <Badge className="bg-red-600">
                      {selectedDefender || '-'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Out Type</p>
                    <Badge className="bg-purple-600">
                      {selectedSymbol ? OUT_TYPES.find(t => t.symbol === selectedSymbol)?.name : '-'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button
              onClick={handleOut}
              className="bg-red-600 hover:bg-red-700"
              disabled={!selectedAttacker || !selectedDefender || !selectedSymbol}
            >
              OUT
            </Button>
            <Button
              onClick={handleUndo}
              className="bg-yellow-600 hover:bg-yellow-700"
              disabled={actions.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedAttacker(null);
                setSelectedDefender(null);
                setSelectedSymbol(null);
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? 'Resume' : 'Pause'} Timer
            </Button>
            <Button
              onClick={handleEndTurn}
              className="bg-blue-800 hover:bg-blue-900"
            >
              End Turn
            </Button>
            <Button
              onClick={handleEndInning}
              className="bg-purple-600 hover:bg-purple-700"
            >
              End Inning
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Action Log</CardTitle>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No actions recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex gap-4 items-center">
                        <Badge className="bg-blue-600">A#{action.attacker}</Badge>
                        <Badge className="bg-red-600">D#{action.defender}</Badge>
                        <Badge className="bg-purple-600">{action.symbol}</Badge>
                        <p className="text-sm">{action.symbolName}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>Turn {action.turn}, Inning {action.inning}</p>
                        <p>{action.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{match.teamA.name} Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Points:</span>
                    <span className="font-medium">{teamAScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Outs:</span>
                    <span className="font-medium">
                      {actions.filter(a => a.turn % 2 === 1).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{match.teamB.name} Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Points:</span>
                    <span className="font-medium">{teamBScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Outs:</span>
                    <span className="font-medium">
                      {actions.filter(a => a.turn % 2 === 0).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* End Turn Dialog */}
      <AlertDialog open={showEndTurnDialog} onOpenChange={setShowEndTurnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              End Turn {currentTurn}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will end the current turn and start Turn {currentTurn + 1}. The timer will reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndTurn} className="bg-blue-600 hover:bg-blue-700">
              End Turn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Inning Dialog */}
      <AlertDialog open={showEndInningDialog} onOpenChange={setShowEndInningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              End Inning {currentInning}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will end the current inning and start Inning {currentInning + 1}. Every 2 turns = 1 inning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndInning} className="bg-purple-600 hover:bg-purple-700">
              End Inning
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
