import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Save, AlertCircle, Edit3 } from 'lucide-react';
import { ScoringAction, Player } from '../../types';
import { toast } from 'sonner@2.0.3';

interface EditActionsPageProps {
  actions: ScoringAction[];
  allDefenders: Player[];
  allAttackers: Player[];
  onSave: (editedActions: ScoringAction[], remarks: string) => void;
  onClose: () => void;
}

const SYMBOLS = [
  { type: 'simple-touch', name: 'Simple Touch', abbr: 'S' },
  { type: 'sudden-attack', name: 'Sudden Attack', abbr: 'SA' },
  { type: 'late-entry', name: 'Late Entry', abbr: 'L' },
  { type: 'pole-dive', name: 'Pole Dive', abbr: 'P' },
  { type: 'out-of-field', name: 'Out of Field', abbr: 'O' },
  { type: 'dive', name: 'Dive', abbr: 'D' },
  { type: 'retired', name: 'Retired', abbr: 'R' },
  { type: 'warning', name: 'Warning', abbr: 'W' },
  { type: 'tap', name: 'Tap', abbr: 'T' },
  { type: 'turn-closure', name: 'Turn Closure', abbr: '][' },
  { type: 'yellow-card', name: 'Yellow Card', abbr: 'Y' },
  { type: 'red-card', name: 'Red Card', abbr: 'F' },
];

export function EditActionsPage({ actions, allDefenders, allAttackers, onSave, onClose }: EditActionsPageProps) {
  // Get last 3 actions
  const lastThreeActions = actions.slice(-3);
  const [editedActions, setEditedActions] = useState<ScoringAction[]>(
    lastThreeActions.map(action => ({ ...action }))
  );
  const [remarks, setRemarks] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditAction = (index: number, field: string, value: string) => {
    const updated = [...editedActions];
    const action = updated[index];

    if (field === 'defender') {
      const defender = allDefenders.find(d => d.id === value);
      if (defender) {
        action.defenderName = defender.name;
        action.defenderJersey = defender.jerseyNumber;
      }
    } else if (field === 'attacker') {
      const attacker = allAttackers.find(a => a.id === value);
      if (attacker) {
        action.attackerName = attacker.name;
        action.attackerJersey = attacker.jerseyNumber;
      }
    } else if (field === 'symbol') {
      action.symbol = value as any;
    }

    setEditedActions(updated);
  };

  const handleSave = () => {
    if (!remarks.trim()) {
      toast.error('Please provide a remark explaining why the edit was made');
      return;
    }

    onSave(editedActions, remarks);
  };

  const toggleEditMode = (index: number) => {
    setEditingIndex(editingIndex === index ? null : index);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg flex items-center justify-between z-10">
          <div>
            <h2 className="text-white mb-1">Edit Last Actions</h2>
            <p className="text-blue-100">You can edit the last 3 actions</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Alert */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-900">
                <strong>Important:</strong> You can edit the last 3 actions. Click "Edit" to modify player selections or symbols. All changes must be accompanied by a remark.
              </p>
            </div>
          </div>

          {/* Editable Actions */}
          <div className="space-y-4">
            {lastThreeActions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No actions to edit</p>
            ) : (
              editedActions.map((action, index) => (
                <Card key={action.id} className={`border-2 ${editingIndex === index ? 'border-blue-400 bg-blue-50' : 'border-blue-200'}`}>
                  <CardHeader className="bg-blue-50 border-b pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-blue-900">
                        Action #{actions.length - lastThreeActions.length + index + 1}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">Inning {action.inning}</Badge>
                        <Badge variant="outline">Turn {action.turn}</Badge>
                        <Button
                          size="sm"
                          variant={editingIndex === index ? "default" : "outline"}
                          onClick={() => toggleEditMode(index)}
                          className={editingIndex === index ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          {editingIndex === index ? 'Editing' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {editingIndex === index ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-700">Defender</Label>
                            <Select
                              value={allDefenders.find(d => d.name === action.defenderName)?.id}
                              onValueChange={(value) => handleEditAction(index, 'defender', value)}
                            >
                              <SelectTrigger className="border-blue-300 bg-white">
                                <SelectValue placeholder="Select defender" />
                              </SelectTrigger>
                              <SelectContent>
                                {allDefenders.map(defender => (
                                  <SelectItem key={defender.id} value={defender.id}>
                                    #{defender.jerseyNumber} - {defender.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm text-gray-700">Attacker</Label>
                            <Select
                              value={allAttackers.find(a => a.name === action.attackerName)?.id}
                              onValueChange={(value) => handleEditAction(index, 'attacker', value)}
                            >
                              <SelectTrigger className="border-red-300 bg-white">
                                <SelectValue placeholder="Select attacker" />
                              </SelectTrigger>
                              <SelectContent>
                                {allAttackers.map(attacker => (
                                  <SelectItem key={attacker.id} value={attacker.id}>
                                    #{attacker.jerseyNumber} - {attacker.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm text-gray-700">Symbol</Label>
                            <Select
                              value={action.symbol}
                              onValueChange={(value) => handleEditAction(index, 'symbol', value)}
                            >
                              <SelectTrigger className="border-indigo-300 bg-white">
                                <SelectValue placeholder="Select symbol" />
                              </SelectTrigger>
                              <SelectContent>
                                {SYMBOLS.map(symbol => (
                                  <SelectItem key={symbol.type} value={symbol.type}>
                                    {symbol.name} ({symbol.abbr})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600">Times (Read-only)</Label>
                            <p className="text-gray-900 font-mono p-2 bg-gray-50 rounded border">
                              Per: {formatTime(action.perTime)} / Run: {formatTime(action.runTime)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-800">
                            <strong>Current Selection:</strong> {action.defenderName} (Defender) vs {action.attackerName} (Attacker) - {SYMBOLS.find(s => s.type === action.symbol)?.name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Defender</Label>
                          <p className="text-gray-900 font-medium">#{action.defenderJersey} - {action.defenderName}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Attacker</Label>
                          <p className="text-gray-900 font-medium">#{action.attackerJersey} - {action.attackerName}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Symbol</Label>
                          <p className="text-gray-900 font-medium">
                            {SYMBOLS.find(s => s.type === action.symbol)?.name || action.symbol}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Per Time / Run Time</Label>
                          <p className="text-gray-900 font-mono">
                            {formatTime(action.perTime)} / {formatTime(action.runTime)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Remarks Section */}
          <Card className="border-2 border-orange-200">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-orange-900">Edit Remarks (Required)</CardTitle>
              <p className="text-sm text-orange-700 mt-1">Explain why you are making these edits. This will be reviewed by the admin.</p>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter detailed remarks about why these actions need to be edited..."
                className="min-h-[120px] border-orange-300"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!remarks.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
