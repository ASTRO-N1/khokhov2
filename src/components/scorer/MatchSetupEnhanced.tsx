import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Users,
  ArrowRight,
  Check,
  Trophy,
  Shield,
  User,
  ArrowLeft,
} from "lucide-react"; // Added ArrowLeft
import { Match, Player } from "../../types";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { toast } from "sonner"; // Ensure toast is imported if used
import { Input } from "../ui/input"; // Import Input if needed for custom timer

interface MatchSetupEnhancedProps {
  match: Match;
  onBack: () => void; // This will now go back to the scorer home
  onStartMatch: (setupData: MatchSetupData) => void;
}

// Ensure playersPerTeam is included if you fetch/pass it
export interface MatchSetupData {
  teamAPlaying: Player[];
  teamASubstitutes: Player[];
  teamBPlaying: Player[];
  teamBSubstitutes: Player[];
  tossWinner: "A" | "B";
  tossDecision: "attack" | "defend";
  playersPerTeam: 7 | 9; // Keep this if needed downstream
  timerDuration: number;
}

export function MatchSetupEnhanced({
  match,
  onBack, // Renamed for clarity
  onStartMatch,
}: MatchSetupEnhancedProps) {
  // Start directly at team-a selection
  const [step, setStep] = useState<"team-a" | "team-b" | "preview">("team-a");
  // Default playersPerTeam to 7, or fetch/pass from tournament settings if available
  const [playersPerTeam] = useState<7 | 9>(match.playersPerTeam || 7);
  const [teamASelected, setTeamASelected] = useState<string[]>([]);
  const [teamBSelected, setTeamBSelected] = useState<string[]>([]);
  const [tossWinner, setTossWinner] = useState<"A" | "B">("A");
  const [tossDecision, setTossDecision] = useState<"attack" | "defend">(
    "attack"
  );
  // Default timer option to 7 minutes, or fetch/pass from tournament settings
  const [timerOption, setTimerOption] = useState<"7" | "9" | "custom">(
    String(match.turnDuration ? match.turnDuration / 60 : 7) as
      | "7"
      | "9"
      | "custom"
  );
  const [customTimerMinutes, setCustomTimerMinutes] = useState<string>(
    String(match.turnDuration ? match.turnDuration / 60 : 7)
  );

  // Pre-select players if resuming setup (optional logic)
  useEffect(() => {
    // If you need to pre-load selections based on saved state, do it here
  }, [match]); // Rerun if match changes

  const handlePlayerToggle = (playerId: string, team: "A" | "B") => {
    if (team === "A") {
      if (teamASelected.includes(playerId)) {
        setTeamASelected(teamASelected.filter((id) => id !== playerId));
      } else if (teamASelected.length < playersPerTeam) {
        setTeamASelected([...teamASelected, playerId]);
      } else {
        toast.warning(`Maximum ${playersPerTeam} players allowed.`);
      }
    } else {
      if (teamBSelected.includes(playerId)) {
        setTeamBSelected(teamBSelected.filter((id) => id !== playerId));
      } else if (teamBSelected.length < playersPerTeam) {
        setTeamBSelected([...teamBSelected, playerId]);
      } else {
        toast.warning(`Maximum ${playersPerTeam} players allowed.`);
      }
    }
  };

  const handleNext = () => {
    if (step === "team-a") {
      if (teamASelected.length !== playersPerTeam) {
        toast.error(
          `Please select exactly ${playersPerTeam} players for ${match.teamA.name}.`
        );
        return;
      }
      setStep("team-b");
    } else if (step === "team-b") {
      if (teamBSelected.length !== playersPerTeam) {
        toast.error(
          `Please select exactly ${playersPerTeam} players for ${match.teamB.name}.`
        );
        return;
      }
      setStep("preview");
    }
  };

  const handleBackStep = () => {
    // No config step to go back to from team-a
    if (step === "team-b") {
      setStep("team-a");
    } else if (step === "preview") {
      setStep("team-b");
    } else if (step === "team-a") {
      onBack(); // Go back to scorer home if on the first step
    }
  };

  const handleStartMatch = () => {
    const teamAPlayingPlayers = match.teamA.players.filter((p) =>
      teamASelected.includes(p.id)
    );
    const teamASubstitutes = match.teamA.players.filter(
      (p) => !teamASelected.includes(p.id)
    );
    const teamBPlayingPlayers = match.teamB.players.filter((p) =>
      teamBSelected.includes(p.id)
    );
    const teamBSubstitutes = match.teamB.players.filter(
      (p) => !teamBSelected.includes(p.id)
    );

    let timerDuration = 0;
    if (timerOption === "7") timerDuration = 7 * 60;
    else if (timerOption === "9") timerDuration = 9 * 60;
    else timerDuration = parseInt(customTimerMinutes) * 60;

    if (isNaN(timerDuration) || timerDuration <= 0) {
      toast.error("Please enter a valid custom timer duration.");
      return;
    }

    const setupData: MatchSetupData = {
      teamAPlaying: teamAPlayingPlayers,
      teamASubstitutes: teamASubstitutes,
      teamBPlaying: teamBPlayingPlayers,
      teamBSubstitutes: teamBSubstitutes,
      tossWinner,
      tossDecision,
      playersPerTeam,
      timerDuration,
    };

    onStartMatch(setupData);
  };

  // Team A Selection (Now the first step)
  if (step === "team-a") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-6 shadow-lg">
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
              <Shield className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex items-center justify-between pt-10 sm:pt-0">
              {" "}
              {/* Added padding top for mobile */}
              <div>
                <h2 className="text-white mb-1">{match.teamA.name}</h2>
                <p className="text-purple-100">
                  {" "}
                  {/* Adjusted color for contrast */}
                  Select {playersPerTeam} playing players
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <p className="text-white text-sm">Step 1 of 3</p>
              </div>
            </div>
          </div>

          <Card className="shadow-lg border-2 border-purple-300">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Player Selection
                </CardTitle>
                <Badge className="bg-purple-600">
                  {teamASelected.length}/{playersPerTeam} Selected
                </Badge>
              </div>
              {/* Captain/Coach Info */}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {match.teamA.players.map((player) => {
                  const isSelected = teamASelected.includes(player.id);
                  const isDisabled =
                    !isSelected && teamASelected.length >= playersPerTeam;
                  return (
                    // REMOVED cursor-pointer and hover styles
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors duration-200 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : "border-gray-200" // Removed hover styles
                      }`}
                      onClick={() =>
                        !isDisabled && handlePlayerToggle(player.id, "A")
                      }
                    >
                      <Checkbox checked={isSelected} disabled={isDisabled} />
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        {player.jerseyNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {player.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Jersey #{player.jerseyNumber}
                        </p>
                      </div>
                      {isSelected && (
                        <Badge className="bg-purple-600">Playing</Badge>
                      )}
                      {isDisabled && !isSelected && (
                        <Badge variant="secondary">Substitute</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6">
                {/* Back button now uses onBack directly */}
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Back to Matches
                </Button>
                <Button
                  onClick={handleNext}
                  // Keep disabled logic
                  disabled={teamASelected.length !== playersPerTeam}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Next - {match.teamB.name}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Team B Selection
  if (step === "team-b") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-600 to-pink-600 p-6 shadow-lg">
            {" "}
            {/* Changed Color */}
            <Button
              variant="ghost"
              onClick={handleBackStep}
              className="absolute top-4 left-4 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
              <Shield className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex items-center justify-between pt-10 sm:pt-0">
              {" "}
              {/* Added padding top for mobile */}
              <div>
                <h2 className="text-white mb-1">{match.teamB.name}</h2>
                <p className="text-red-100">
                  {" "}
                  {/* Adjusted color */}
                  Select {playersPerTeam} playing players
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <p className="text-white text-sm">Step 2 of 3</p>
              </div>
            </div>
          </div>

          <Card className="shadow-lg border-2 border-red-300">
            {" "}
            {/* Changed Color */}
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-100">
              {" "}
              {/* Changed Color */}
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" />{" "}
                  {/* Changed Color */}
                  Player Selection
                </CardTitle>
                <Badge className="bg-red-600">
                  {" "}
                  {/* Changed Color */}
                  {teamBSelected.length}/{playersPerTeam} Selected
                </Badge>
              </div>
              {/* Captain/Coach Info */}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {match.teamB.players.map((player) => {
                  const isSelected = teamBSelected.includes(player.id);
                  const isDisabled =
                    !isSelected && teamBSelected.length >= playersPerTeam;
                  return (
                    // REMOVED cursor-pointer and hover styles
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors duration-200 ${
                        isSelected
                          ? "border-red-600 bg-red-50" // Changed color
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : "border-gray-200" // Removed hover styles
                      }`}
                      onClick={() =>
                        !isDisabled && handlePlayerToggle(player.id, "B")
                      }
                    >
                      <Checkbox checked={isSelected} disabled={isDisabled} />
                      <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        {" "}
                        {/* Changed Color */}
                        {player.jerseyNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {player.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Jersey #{player.jerseyNumber}
                        </p>
                      </div>
                      {isSelected && (
                        <Badge className="bg-red-600">Playing</Badge>
                      )}{" "}
                      {/* Changed Color */}
                      {isDisabled && !isSelected && (
                        <Badge variant="secondary">Substitute</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleBackStep}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={teamBSelected.length !== playersPerTeam}
                  className="flex-1 bg-red-600 hover:bg-red-700" // Changed Color
                >
                  Next - Preview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Preview Step (mostly unchanged, just step numbering)
  const teamAPlaying = match.teamA.players.filter((p) =>
    teamASelected.includes(p.id)
  );
  const teamASubstitutes = match.teamA.players.filter(
    (p) => !teamASelected.includes(p.id)
  );
  const teamBPlaying = match.teamB.players.filter((p) =>
    teamBSelected.includes(p.id)
  );
  const teamBSubstitutes = match.teamB.players.filter(
    (p) => !teamBSelected.includes(p.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <Button
            variant="ghost"
            onClick={handleBackStep}
            className="absolute top-4 left-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
            <Trophy className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between pt-10 sm:pt-0">
            {" "}
            {/* Added padding top for mobile */}
            <div>
              <h2 className="text-white mb-1">Match Preview</h2>
              <p className="text-blue-100">
                {match.matchNumber} - {match.tournamentName}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <p className="text-white text-sm">Step 3 of 3</p>{" "}
              {/* Updated step count */}
            </div>
          </div>
        </div>
        {/* Team Lineups */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-2 border-blue-300">
            {/* ... Team A details ... */}
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {match.teamA.name}
              </CardTitle>
              <div className="space-y-1 text-sm">
                <p className="text-blue-700">Captain: {match.teamA.captain}</p>
                {match.teamA.coach && (
                  <p className="text-blue-700">Coach: {match.teamA.coach}</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Playing ({teamAPlaying.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {teamAPlaying.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                          {player.jerseyNumber}
                        </div>
                        <span className="text-sm text-gray-900 truncate">
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Substitutes ({teamASubstitutes.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {teamASubstitutes.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                          {player.jerseyNumber}
                        </div>
                        <span className="text-sm text-gray-600 truncate">
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-2 border-red-300">
            {/* ... Team B details ... */}
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-100">
              <CardTitle className="text-red-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {match.teamB.name}
              </CardTitle>
              <div className="space-y-1 text-sm">
                <p className="text-red-700">Captain: {match.teamB.captain}</p>
                {match.teamB.coach && (
                  <p className="text-red-700">Coach: {match.teamB.coach}</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Playing ({teamBPlaying.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {teamBPlaying.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                          {player.jerseyNumber}
                        </div>
                        <span className="text-sm text-gray-900 truncate">
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Substitutes ({teamBSubstitutes.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {teamBSubstitutes.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                          {player.jerseyNumber}
                        </div>
                        <span className="text-sm text-gray-600 truncate">
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Toss Details & Timer */}
        <Card className="shadow-lg border-2 border-blue-300">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Trophy className="w-5 h-5" />
              Toss & Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Toss Winner Select */}
              <div className="space-y-2">
                <Label className="text-gray-700">Toss Won By</Label>
                <Select
                  value={tossWinner}
                  onValueChange={(value: "A" | "B") => setTossWinner(value)}
                >
                  <SelectTrigger className="border-gray-300 rounded-lg h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">{match.teamA.name}</SelectItem>
                    <SelectItem value="B">{match.teamB.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Toss Decision Select */}
              <div className="space-y-2">
                <Label className="text-gray-700">Choice</Label>
                <Select
                  value={tossDecision}
                  onValueChange={(value: "attack" | "defend") =>
                    setTossDecision(value)
                  }
                >
                  <SelectTrigger className="border-gray-300 rounded-lg h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attack">Attack First</SelectItem>
                    <SelectItem value="defend">Defend First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-sm text-blue-900">
                <strong>
                  {tossWinner === "A" ? match.teamA.name : match.teamB.name}
                </strong>{" "}
                won the toss and chose to{" "}
                <strong>
                  {tossDecision === "attack" ? "Attack" : "Defend"}
                </strong>{" "}
                first.
              </p>
            </div>
            {/* Timer Configuration */}
            <div className="space-y-4 border-t pt-6">
              <Label className="text-gray-700">Turn Duration</Label>
              <RadioGroup
                value={timerOption}
                onValueChange={(val) =>
                  setTimerOption(val as "7" | "9" | "custom")
                }
              >
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`relative flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      timerOption === "7"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setTimerOption("7")}
                  >
                    <RadioGroupItem value="7" id="7-min" />
                    <Label htmlFor="7-min" className="flex-1 cursor-pointer">
                      <p className="font-medium text-gray-900">7 Minutes</p>
                      <p className="text-sm text-gray-500">Standard</p>
                    </Label>
                    {timerOption === "7" && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div
                    className={`relative flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      timerOption === "9"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setTimerOption("9")}
                  >
                    <RadioGroupItem value="9" id="9-min" />
                    <Label htmlFor="9-min" className="flex-1 cursor-pointer">
                      <p className="font-medium text-gray-900">9 Minutes</p>
                      <p className="text-sm text-gray-500">Extended</p>
                    </Label>
                    {timerOption === "9" && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div
                    className={`relative flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      timerOption === "custom"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setTimerOption("custom")}
                  >
                    <RadioGroupItem value="custom" id="custom-min" />
                    <Label
                      htmlFor="custom-min"
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium text-gray-900">Custom</p>
                      <p className="text-sm text-gray-500">Set manually</p>
                    </Label>
                    {timerOption === "custom" && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </RadioGroup>
              {timerOption === "custom" && (
                <div className="space-y-2">
                  <Label className="text-gray-700">
                    Enter Duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={customTimerMinutes}
                    onChange={(e) => setCustomTimerMinutes(e.target.value)}
                    className="border-gray-300 rounded-lg h-11"
                    placeholder="Enter minutes"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Start Match Button */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBackStep} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleStartMatch}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 shadow-lg hover:shadow-xl transition-all text-white"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Start Match
          </Button>
        </div>
      </div>
    </div>
  );
}
