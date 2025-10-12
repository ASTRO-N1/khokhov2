import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Play, Pause, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Match, Player, ScoringAction, SymbolType } from '../../types';
import { MatchSetupData } from './MatchSetupEnhanced';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface LiveScoringV3Props {
  match: Match;
  setupData: MatchSetupData;
  onBack: () => void;
  onEndMatch: (actions: ScoringAction[]) => void;
}

const SYMBOLS: { type: SymbolType; name: string; abbr: string; icon: string }[] = [
  { type: 'simple-touch', name: 'Simple Touch', abbr: 'S', icon: '👆' },
  { type: 'sudden-attack', name: 'Sudden Attack', abbr: 'SA', icon: '⚡' },
  { type: 'late-entry', name: 'Late Entry', abbr: 'L', icon: '⏰' },
  { type: 'pole-dive', name: 'Pole Dive', abbr: 'P', icon: '🤸' },
  { type: 'out-of-field', name: 'Out of Field', abbr: 'O', icon: '🚫' },
  { type: 'dive', name: 'Dive', abbr: 'D', icon: '🏊' },
  { type: 'retired', name: 'Retired', abbr: 'R', icon: '🚶' },
  { type: 'warning', name: 'Warning', abbr: 'W', icon: '⚠️' },
  { type: 'tap', name: 'Tap', abbr: 'T', icon: '✋' },
  { type: 'turn-closure', name: 'Turn Closure', abbr: '][', icon: '🔚' },
  { type: 'yellow-card', name: 'Yellow Card', abbr: 'Y', icon: '🟨' },
  { type: 'red-card', name: 'Red Card', abbr: 'F', icon: '🟥' },
];

export function LiveScoringV3({ match, setupData, onBack, onEndMatch }: LiveScoringV3Props) {
  const [currentTab, setCurrentTab] = useState<'scoring' | 'scoresheet'>('scoring');
  const [currentInning, setCurrentInning] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Scoring state
  const [selectedDefender, setSelectedDefender] = useState<Player | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<Player | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType | null>(null);
  const [substituteMode, setSubstituteMode] = useState(false);
  const [attackerToSwap, setAttackerToSwap] = useState<Player | null>(null);
  const [substituteToSwapIn, setSubstituteToSwapIn] = useState<Player | null>(null);
  const [actions, setActions] = useState<ScoringAction[]>([]);
  
  // Current defenders and attackers based on toss
  const [currentDefendingTeam, setCurrentDefendingTeam] = useState<'A' | 'B'>(
    setupData.tossDecision === 'defend' ? setupData.tossWinner : (setupData.tossWinner === 'A' ? 'B' : 'A')
  );
  
  // Track playing and substitute players dynamically
  const [teamAPlaying, setTeamAPlaying] = useState<Player[]>(setupData.teamAPlaying);
  const [teamASubstitutes, setTeamASubstitutes] = useState<Player[]>(setupData.teamASubstitutes);
  const [teamBPlaying, setTeamBPlaying] = useState<Player[]>(setupData.teamBPlaying);
  const [teamBSubstitutes, setTeamBSubstitutes] = useState<Player[]>(setupData.teamBSubstitutes);
  
  const defenders = currentDefendingTeam === 'A' ? teamAPlaying : teamBPlaying;
  const attackers = currentDefendingTeam === 'A' ? teamBPlaying : teamAPlaying;
  const attackerSubstitutes = currentDefendingTeam === 'A' ? teamBSubstitutes : teamASubstitutes;

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
    setSubstituteToSwapIn(null);
  };

  // Handle attacker selection
  const handleAttackerSelect = (attacker: Player) => {
    if (!selectedDefender) {
      toast.error('Please select a defender first');
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
    setSelectedSymbol(symbol);
  };

  // Handle substitute button click
  const handleSubstituteClick = () => {
    if (!selectedAttacker) {
      toast.error('Please select a playing attacker to substitute');
      return;
    }
    setSubstituteMode(true);
    setAttackerToSwap(selectedAttacker);
    toast.info(`Select a substitute player to swap with ${selectedAttacker.name}`);
  };

  // Handle substitute selection
  const handleSubstituteSelect = (substitute: Player) => {
    if (!attackerToSwap) return;
    
    // Perform the swap
    if (currentDefendingTeam === 'A') {
      // Attacking team is B
      const newPlaying = teamBPlaying.filter(p => p.id !== attackerToSwap.id);
      newPlaying.push(substitute);
      const newSubstitutes = teamBSubstitutes.filter(p => p.id !== substitute.id);
      newSubstitutes.push(attackerToSwap);
      setTeamBPlaying(newPlaying);
      setTeamBSubstitutes(newSubstitutes);
    } else {
      // Attacking team is A
      const newPlaying = teamAPlaying.filter(p => p.id !== attackerToSwap.id);
      newPlaying.push(substitute);
      const newSubstitutes = teamASubstitutes.filter(p => p.id !== substitute.id);
      newSubstitutes.push(attackerToSwap);
      setTeamAPlaying(newPlaying);
      setTeamASubstitutes(newSubstitutes);
    }
    
    toast.success(`Swapped ${attackerToSwap.name} with ${substitute.name}`);
    setSelectedAttacker(substitute);
    setSubstituteMode(false);
    setAttackerToSwap(null);
    setSubstituteToSwapIn(null);
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
    toast.success(`${selectedDefender.name} is OUT!`);
    
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

  // Handle delete last action
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
      {/* Header - Clean and Minimal */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-900">{match.matchNumber}</h2>
              <p className="text-sm text-gray-600">{match.teamA.name} vs {match.teamB.name}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Scores */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">{match.teamA.name}</p>
                  <p className="text-2xl text-blue-600">{scores.teamA}</p>
                </div>
                <div className="text-gray-400">-</div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{match.teamB.name}</p>
                  <p className="text-2xl text-blue-600">{scores.teamB}</p>
                </div>
              </div>
              
              {/* Inning Badge */}
              <Badge className="bg-blue-600 px-3 py-1.5">
                Inning {currentInning}
              </Badge>
            </div>
          </div>

          {/* Timer - Large and Prominent */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Match Timer</p>
              <div className="bg-blue-600 rounded-lg px-8 py-4 shadow-md">
                <p className="text-white text-5xl font-mono tracking-wider">{formatTime(timer)}</p>
              </div>
            </div>
          </div>

          {/* Timer Controls - Wide Buttons */}
          <div className="flex gap-3 mb-4">
            <Button
              onClick={() => setIsTimerRunning(true)}
              disabled={isTimerRunning}
              className="flex-1 bg-green-600 hover:bg-green-700 h-12"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Timer
            </Button>
            <Button
              onClick={() => setIsTimerRunning(false)}
              disabled={!isTimerRunning}
              className="flex-1 bg-orange-600 hover:bg-orange-700 h-12"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause Timer
            </Button>
            <Button
              onClick={handleDeleteLastAction}
              variant="outline"
              className="flex-1 h-12 border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Last
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={(val) => setCurrentTab(val as 'scoring' | 'scoresheet')}>
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="scoring" className="text-base">Scoring</TabsTrigger>
              <TabsTrigger value="scoresheet" className="text-base">Scoresheet</TabsTrigger>
            </TabsList>

            {/* Scoring Tab */}
            <TabsContent value="scoring" className="mt-6 space-y-4">
              {/* Current Selection Status */}
              {substituteMode && attackerToSwap && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-yellow-900">
                    🔄 Substitution Mode: Select a substitute player to replace <strong>{attackerToSwap.name}</strong>
                  </p>
                </div>
              )}

              {!substituteMode && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedDefender ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-700">
                            <strong>Defender:</strong> {selectedDefender ? selectedDefender.name : 'Not selected'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedAttacker ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-700">
                            <strong>Attacker:</strong> {selectedAttacker ? selectedAttacker.name : 'Not selected'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedSymbol ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-700">
                            <strong>Symbol:</strong> {selectedSymbol ? SYMBOLS.find(s => s.type === selectedSymbol)?.name : 'Not selected'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grids Container */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Defenders Grid */}
                <Card className="border-gray-300">
                  <CardHeader className="border-b bg-gray-50 py-3">
                    <CardTitle className="text-base text-gray-900">Defenders</CardTitle>
                    <p className="text-xs text-gray-600">{currentDefendingTeam === 'A' ? match.teamA.name : match.teamB.name}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {defenders.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handleDefenderSelect(player)}
                          disabled={substituteMode}
                          className={`p-3 rounded border transition-all ${
                            selectedDefender?.id === player.id
                              ? 'border-blue-600 bg-blue-100'
                              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                          } ${substituteMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="text-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-1">
                              {player.jerseyNumber}
                            </div>
                            <p className="text-xs text-gray-900 truncate">{player.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Attackers Grid */}
                <Card className="border-gray-300">
                  <CardHeader className="border-b bg-gray-50 py-3">
                    <CardTitle className="text-base text-gray-900">Attackers</CardTitle>
                    <p className="text-xs text-gray-600">{currentDefendingTeam === 'A' ? match.teamB.name : match.teamA.name}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    {!substituteMode ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {attackers.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => handleAttackerSelect(player)}
                              disabled={!selectedDefender}
                              className={`p-3 rounded border transition-all ${
                                selectedAttacker?.id === player.id
                                  ? 'border-blue-600 bg-blue-100'
                                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                              } ${!selectedDefender ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className="text-center">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-1">
                                  {player.jerseyNumber}
                                </div>
                                <p className="text-xs text-gray-900 truncate">{player.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        <Button
                          onClick={handleSubstituteClick}
                          disabled={!selectedAttacker}
                          variant="outline"
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Substitute
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 mb-3">Select substitute:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {attackerSubstitutes.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => handleSubstituteSelect(player)}
                              className="p-3 rounded border border-green-300 hover:border-green-500 hover:bg-green-50 transition-all"
                            >
                              <div className="text-center">
                                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-1">
                                  {player.jerseyNumber}
                                </div>
                                <p className="text-xs text-gray-900 truncate">{player.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        <Button
                          onClick={() => {
                            setSubstituteMode(false);
                            setAttackerToSwap(null);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Symbols Grid */}
                <Card className="border-gray-300">
                  <CardHeader className="border-b bg-gray-50 py-3">
                    <CardTitle className="text-base text-gray-900">Symbols</CardTitle>
                    <p className="text-xs text-gray-600">Type of out</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {SYMBOLS.map((symbol) => (
                        <button
                          key={symbol.type}
                          onClick={() => handleSymbolSelect(symbol.type)}
                          disabled={!selectedDefender || !selectedAttacker || substituteMode}
                          className={`p-2 rounded border transition-all ${
                            selectedSymbol === symbol.type
                              ? 'border-blue-600 bg-blue-100'
                              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                          } ${!selectedDefender || !selectedAttacker || substituteMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="text-center">
                            <span className="text-2xl">{symbol.icon}</span>
                            <p className="text-xs mt-1">{symbol.name}</p>
                            <p className="text-xs text-gray-500">({symbol.abbr})</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Wide OUT Button */}
                    <Button
                      onClick={handleOut}
                      disabled={!selectedDefender || !selectedAttacker || !selectedSymbol}
                      className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg"
                    >
                      OUT
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Scoresheet Tab */}
            <TabsContent value="scoresheet" className="mt-6 space-y-4">
              {/* View Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="h-12">
                  View Defender Scoresheet
                </Button>
                <Button variant="outline" className="h-12">
                  View Attacker Scoresheet
                </Button>
                <Button variant="outline" className="h-12">
                  Consolidated Result
                </Button>
              </div>

              {/* Defender Scoresheet */}
              <Card>
                <CardHeader className="border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900">Defender Scoresheet - Inning {currentInning}</CardTitle>
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 text-sm text-gray-600">Jersey</th>
                          <th className="text-left p-4 text-sm text-gray-600">Name</th>
                          <th className="text-left p-4 text-sm text-gray-600">Per Time</th>
                          <th className="text-left p-4 text-sm text-gray-600">Run Time</th>
                          <th className="text-left p-4 text-sm text-gray-600">Out By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defenderScoresheet.length > 0 ? (
                          defenderScoresheet.map((record, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-4">
                                <Badge variant="outline">#{record.jerseyNumber}</Badge>
                              </td>
                              <td className="p-4 text-gray-900">{record.name}</td>
                              <td className="p-4 font-mono text-blue-600">{formatTime(record.perTime)}</td>
                              <td className="p-4 font-mono text-gray-600">{formatTime(record.runTime)}</td>
                              <td className="p-4 text-gray-900">{record.outBy}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">
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
              <Card>
                <CardHeader className="border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900">Attacker Scoresheet - Inning {currentInning}</CardTitle>
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 text-sm text-gray-600">Jersey</th>
                          <th className="text-left p-4 text-sm text-gray-600">Name</th>
                          <th className="text-left p-4 text-sm text-gray-600">Points</th>
                          <th className="text-left p-4 text-sm text-gray-600">Defenders Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(attackerScoresheet).length > 0 ? (
                          Object.entries(attackerScoresheet).map(([jersey, data]) => (
                            <tr key={jersey} className="border-b hover:bg-gray-50">
                              <td className="p-4">
                                <Badge variant="outline">#{jersey}</Badge>
                              </td>
                              <td className="p-4 text-gray-900">{data.name}</td>
                              <td className="p-4">
                                <Badge className="bg-green-600">{data.points}</Badge>
                              </td>
                              <td className="p-4 text-sm text-gray-600">{data.defendersOut.join(', ')}</td>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
