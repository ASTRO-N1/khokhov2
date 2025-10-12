import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Trophy, AlertCircle, Check, Edit2, RefreshCw, Power, Repeat } from 'lucide-react';
import { Match, Player, ScoringAction, SymbolType } from '../../types';
import { MatchSetupData } from './MatchSetupEnhanced';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface LiveScoringV2Props {
  match: Match;
  setupData: MatchSetupData;
  onBack: () => void;
  onEndMatch: (actions: ScoringAction[]) => void;
}

const SYMBOLS: { type: SymbolType; name: string; color: string }[] = [
  { type: 'simple-touch', name: 'Simple Touch', color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
  { type: 'sudden-attack', name: 'Sudden Attack', color: 'bg-purple-100 hover:bg-purple-200 border-purple-300' },
  { type: 'late-entry', name: 'Late Entry', color: 'bg-orange-100 hover:bg-orange-200 border-orange-300' },
  { type: 'pole-dive', name: 'Pole Dive', color: 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300' },
  { type: 'out-of-field', name: 'Out of Field', color: 'bg-red-100 hover:bg-red-200 border-red-300' },
  { type: 'dive', name: 'Dive', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
  { type: 'retired', name: 'Retired', color: 'bg-gray-100 hover:bg-gray-200 border-gray-300' },
  { type: 'warning', name: 'Warning', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
  { type: 'tap', name: 'Tap', color: 'bg-teal-100 hover:bg-teal-200 border-teal-300' },
  { type: 'turn-closure', name: 'Turn Closure', color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300' },
  { type: 'yellow-card', name: 'Yellow Card', color: 'bg-yellow-300 hover:bg-yellow-400 border-yellow-500' },
  { type: 'red-card', name: 'Red Card', color: 'bg-red-300 hover:bg-red-400 border-red-500' },
  { type: 'substitute', name: 'Substitute', color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300' },
];

export function LiveScoringV2({ match, setupData, onBack, onEndMatch }: LiveScoringV2Props) {
  const [currentTab, setCurrentTab] = useState<'scoring' | 'scoresheet'>('scoring');
  const [currentInning, setCurrentInning] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  
  // Scoring state
  const [selectedDefender, setSelectedDefender] = useState<Player | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<Player | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType | null>(null);
  const [substituteMode, setSubstituteMode] = useState(false);
  const [attackerToSwap, setAttackerToSwap] = useState<Player | null>(null);
  const [actions, setActions] = useState<ScoringAction[]>([]);
  
  // Current defenders and attackers based on toss
  const [currentDefendingTeam, setCurrentDefendingTeam] = useState<'A' | 'B'>(
    setupData.tossDecision === 'defend' ? setupData.tossWinner : (setupData.tossWinner === 'A' ? 'B' : 'A')
  );
  
  const defenders = currentDefendingTeam === 'A' ? setupData.teamAPlaying : setupData.teamBPlaying;
  const attackers = currentDefendingTeam === 'A' ? setupData.teamBPlaying : setupData.teamAPlaying;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle defender selection
  const handleDefenderSelect = (defender: Player) => {
    setSelectedDefender(defender);
    setSelectedAttacker(null);
    setSelectedSymbol(null);
    setSubstituteMode(false);
    setAttackerToSwap(null);
  };

  // Handle attacker selection
  const handleAttackerSelect = (attacker: Player) => {
    if (!selectedDefender) {
      toast.error('Please select a defender first');
      return;
    }
    
    // If in substitute mode, this is the attacker to swap with
    if (substituteMode && attackerToSwap) {
      toast.success(`Swapped ${attackerToSwap.name} with ${attacker.name}`);
      setSelectedAttacker(attacker);
      setSubstituteMode(false);
      setAttackerToSwap(null);
      setSelectedSymbol(null);
      return;
    }
    
    setSelectedAttacker(attacker);
    setSelectedSymbol(null);
  };

  // Handle symbol selection
  const handleSymbolSelect = (symbol: SymbolType) => {
    if (!selectedDefender) {
      toast.error('Please select a defender first');
      return;
    }
    if (!selectedAttacker) {
      toast.error('Please select an attacker');
      return;
    }
    
    // If substitute symbol is selected, enable substitute mode
    if (symbol === 'substitute') {
      setSubstituteMode(true);
      setAttackerToSwap(selectedAttacker);
      toast.info('Select a new attacker to swap with');
      return;
    }
    
    setSelectedSymbol(symbol);
  };

  // Handle "Out" confirmation
  const handleOut = () => {
    if (!selectedDefender || !selectedAttacker || !selectedSymbol) {
      toast.error('Please select Defender → Attacker → Symbol');
      return;
    }

    // Calculate Per Time
    const previousActions = actions.filter(a => a.inning === currentInning);
    const previousRunTime = previousActions.length > 0 
      ? previousActions[previousActions.length - 1].runTime 
      : 0;
    const perTime = timer - previousRunTime;

    const newAction: ScoringAction = {
      id: `${Date.now()}-${Math.random()}`,
      matchId: match.id,
      turn: 1,
      inning: currentInning,
      defenderJersey: selectedDefender.jerseyNumber,
      defenderName: selectedDefender.name,
      attackerJersey: selectedAttacker.jerseyNumber,
      attackerName: selectedAttacker.name,
      symbol: selectedSymbol,
      actionType: 'out',
      points: 1,
      runTime: timer,
      perTime: perTime,
      timestamp: new Date().toISOString(),
      team: currentDefendingTeam === 'A' ? 'defender' : 'attacker',
    };

    setActions([...actions, newAction]);
    toast.success(`${selectedDefender.name} is OUT! Per Time: ${formatTime(perTime)}`);
    
    // Reset selections
    setSelectedDefender(null);
    setSelectedAttacker(null);
    setSelectedSymbol(null);
  };

  // Calculate scores from actions
  const calculateScores = () => {
    const teamAActions = actions.filter(a => 
      (currentDefendingTeam === 'A' && a.team === 'defender') || 
      (currentDefendingTeam === 'B' && a.team === 'attacker')
    );
    const teamBActions = actions.filter(a => 
      (currentDefendingTeam === 'B' && a.team === 'defender') || 
      (currentDefendingTeam === 'A' && a.team === 'attacker')
    );
    
    return {
      teamA: teamAActions.reduce((sum, a) => sum + a.points, 0),
      teamB: teamBActions.reduce((sum, a) => sum + a.points, 0),
    };
  };

  const scores = calculateScores();

  // Defender Scoresheet data
  const defenderScoresheet = actions
    .filter(a => a.inning === currentInning)
    .map(action => ({
      jerseyNumber: action.defenderJersey,
      name: action.defenderName,
      perTime: action.perTime,
      runTime: action.runTime,
      outBy: action.attackerName,
      symbol: action.symbol,
    }));

  // Attacker Scoresheet data
  const attackerScoresheet: { [key: number]: { name: string; points: number; defendersOut: string[] } } = {};
  actions.filter(a => a.inning === currentInning).forEach(action => {
    if (!attackerScoresheet[action.attackerJersey]) {
      attackerScoresheet[action.attackerJersey] = {
        name: action.attackerName,
        points: 0,
        defendersOut: [],
      };
    }
    attackerScoresheet[action.attackerJersey].points += action.points;
    attackerScoresheet[action.attackerJersey].defendersOut.push(action.defenderName);
  });

  // Dummy control functions
  const handleEditInning = () => {
    toast.info('Edit Inning feature - Coming soon');
  };

  const handleChangeTurns = () => {
    toast.info('Change Turns feature - Coming soon');
  };

  const handleEndMatch = () => {
    if (confirm('Are you sure you want to end this match?')) {
      onEndMatch(actions);
    }
  };

  const handleDeleteLastAction = () => {
    if (actions.length > 0) {
      const lastAction = actions[actions.length - 1];
      if (confirm(`Delete last action: ${lastAction.defenderName} out?`)) {
        setActions(actions.slice(0, -1));
        toast.success('Last action deleted');
      }
    } else {
      toast.error('No actions to delete');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs value={currentTab} onValueChange={(val) => setCurrentTab(val as 'scoring' | 'scoresheet')}>
        {/* Sticky Header - More Compact */}
        <div className="sticky top-0 z-50 bg-white border-b shadow-md">
          <div className="px-4 lg:px-6 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-gray-900">{match.matchNumber}</h2>
                  <p className="text-sm text-gray-600">{match.teamA.name} vs {match.teamB.name}</p>
                </div>
              </div>
              
              {/* Timer - Softer Colors */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <p className="text-xs text-gray-500 mb-1">Match Timer</p>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg px-5 py-2 shadow-md">
                    <p className="text-white text-3xl font-mono">{formatTime(timer)}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="h-8"
                    >
                      {isTimerRunning ? 'Pause' : 'Resume'}
                    </Button>
                    <Badge className="bg-blue-600 px-2 py-1">
                      Inning {currentInning}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">{match.teamA.name}</p>
                  <p className="text-xl text-blue-600">{scores.teamA}</p>
                </div>
                <div className="text-gray-400">-</div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{match.teamB.name}</p>
                  <p className="text-xl text-blue-600">{scores.teamB}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <TabsList className="grid w-full max-w-md grid-cols-2 mt-3">
              <TabsTrigger value="scoring">Scoring</TabsTrigger>
              <TabsTrigger value="scoresheet">Scoresheet</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Scoring Tab - Completely Redesigned for Compactness */}
        <TabsContent value="scoring" className="p-4 mt-0">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Control Buttons Row */}
            <Card className="shadow-md border-blue-200">
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditInning}
                    className="flex-1 min-w-[140px]"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Inning
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChangeTurns}
                    className="flex-1 min-w-[140px]"
                  >
                    <Repeat className="w-4 h-4 mr-2" />
                    Change Turns
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteLastAction}
                    className="flex-1 min-w-[140px] text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Delete Last
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndMatch}
                    className="flex-1 min-w-[140px] text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    End Match
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Selection + OUT Button - Prominent */}
            <Card className="shadow-md border-2 border-blue-300 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedDefender ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-700">
                        <strong>D:</strong> {selectedDefender ? `#${selectedDefender.jerseyNumber} ${selectedDefender.name}` : 'Select defender'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedAttacker ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-700">
                        <strong>A:</strong> {selectedAttacker ? `#${selectedAttacker.jerseyNumber} ${selectedAttacker.name}` : 'Select attacker'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedSymbol ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-700">
                        <strong>S:</strong> {selectedSymbol ? SYMBOLS.find(s => s.type === selectedSymbol)?.name : 'Select symbol'}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleOut}
                    disabled={!selectedDefender || !selectedAttacker || !selectedSymbol}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg h-12 px-8 text-lg"
                    size="lg"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    OUT
                  </Button>
                </div>
                {substituteMode && (
                  <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-sm text-yellow-900">
                      🔄 Substitute mode: Select a new attacker to replace #{attackerToSwap?.jerseyNumber} {attackerToSwap?.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Grids in One Row - Ultra Compact */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Defenders - Compact */}
              <Card className="shadow-md border-2 border-red-300">
                <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-100 p-3">
                  <CardTitle className="text-red-900 text-base flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Defenders
                  </CardTitle>
                  <p className="text-xs text-red-700">{currentDefendingTeam === 'A' ? match.teamA.name : match.teamB.name}</p>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {defenders.slice(0, 16).map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleDefenderSelect(player)}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all text-xs ${
                          selectedDefender?.id === player.id
                            ? 'border-red-600 bg-red-100 shadow-md scale-105'
                            : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white">
                          {player.jerseyNumber}
                        </div>
                        <p className="text-xs text-gray-900 text-center px-1 truncate w-full leading-tight">{player.name.split(' ')[0]}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Attackers - Compact */}
              <Card className="shadow-md border-2 border-blue-300">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100 p-3">
                  <CardTitle className="text-blue-900 text-base flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Attackers
                  </CardTitle>
                  <p className="text-xs text-blue-700">{currentDefendingTeam === 'A' ? match.teamB.name : match.teamA.name}</p>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {attackers.slice(0, 16).map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleAttackerSelect(player)}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all text-xs ${
                          selectedAttacker?.id === player.id
                            ? 'border-blue-600 bg-blue-100 shadow-md scale-105'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        } ${!selectedDefender ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!selectedDefender}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white">
                          {player.jerseyNumber}
                        </div>
                        <p className="text-xs text-gray-900 text-center px-1 truncate w-full leading-tight">{player.name.split(' ')[0]}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Symbols - Compact */}
              <Card className="shadow-md border-2 border-purple-300">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100 p-3">
                  <CardTitle className="text-purple-900 text-base flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Symbols
                  </CardTitle>
                  <p className="text-xs text-purple-700">Type of out</p>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {SYMBOLS.map((symbol) => (
                      <button
                        key={symbol.type}
                        onClick={() => handleSymbolSelect(symbol.type)}
                        className={`aspect-square rounded-lg border-2 flex items-center justify-center p-1 transition-all ${
                          selectedSymbol === symbol.type
                            ? 'border-purple-600 shadow-md scale-105'
                            : symbol.color
                        } ${!selectedDefender || !selectedAttacker ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!selectedDefender || !selectedAttacker}
                      >
                        <p className="text-[10px] text-center leading-tight">{symbol.name}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Scoresheet Tab */}
        <TabsContent value="scoresheet" className="p-4 mt-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Defender Scoresheet */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-100">
                <CardTitle className="text-red-900">Defender Scoresheet - Inning {currentInning}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Jersey No.</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Per Time</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Run Time</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Out By</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Symbol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {defenderScoresheet.length > 0 ? (
                        defenderScoresheet.map((record, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <Badge variant="outline">#{record.jerseyNumber}</Badge>
                            </td>
                            <td className="p-3">{record.name}</td>
                            <td className="p-3 font-mono text-blue-600">{formatTime(record.perTime)}</td>
                            <td className="p-3 font-mono text-green-600">{formatTime(record.runTime)}</td>
                            <td className="p-3">{record.outBy}</td>
                            <td className="p-3 text-sm">{SYMBOLS.find(s => s.type === record.symbol)?.name}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No defender outs recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Attacker Scoresheet */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="text-blue-900">Attacker Scoresheet - Inning {currentInning}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Jersey No.</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Total Points</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Defenders Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(attackerScoresheet).length > 0 ? (
                        Object.entries(attackerScoresheet).map(([jersey, data]) => (
                          <tr key={jersey} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <Badge variant="outline">#{jersey}</Badge>
                            </td>
                            <td className="p-3">{data.name}</td>
                            <td className="p-3">
                              <Badge className="bg-green-600">{data.points}</Badge>
                            </td>
                            <td className="p-3 text-sm">{data.defendersOut.join(', ')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            No attacker points recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
