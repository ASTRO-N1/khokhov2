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
  ArrowLeft,
} from "lucide-react";
import { Match, Player } from "../../types";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { supabase } from "../../supabaseClient"; // Added Supabase Import

interface MatchSetupEnhancedProps {
  match: Match;
  onBack: () => void;
  onStartMatch: (setupData: MatchSetupData) => void;
}

export interface MatchSetupData {
  teamAPlaying: Player[];
  teamASubstitutes: Player[];
  teamBPlaying: Player[];
  teamBSubstitutes: Player[];
  tossWinner: "A" | "B";
  tossDecision: "attack" | "defend";
  playersPerTeam: 7 | 9;
  timerDuration: number;
}

export function MatchSetupEnhanced({
  match,
  onBack,
  onStartMatch,
}: MatchSetupEnhancedProps) {
  const [step, setStep] = useState<"team-a" | "team-b" | "preview">("team-a");
  const [playersPerTeam] = useState<7 | 9>(match.playersPerTeam || 9);
  const [teamASelected, setTeamASelected] = useState<string[]>([]);
  const [teamBSelected, setTeamBSelected] = useState<string[]>([]);
  const [tossWinner, setTossWinner] = useState<"A" | "B">("A");
  const [tossDecision, setTossDecision] = useState<"attack" | "defend">(
    "attack"
  );
  const [timerOption, setTimerOption] = useState<"7" | "9" | "custom">(
    String(match.turnDuration ? match.turnDuration / 60 : 7) as
      | "7"
      | "9"
      | "custom"
  );
  const [customTimerMinutes, setCustomTimerMinutes] = useState<string>(
    String(match.turnDuration ? match.turnDuration / 60 : 7)
  );
  const [isStarting, setIsStarting] = useState(false);

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
    if (step === "team-b") {
      setStep("team-a");
    } else if (step === "preview") {
      setStep("team-b");
    } else if (step === "team-a") {
      onBack();
    }
  };

  const handleStartMatch = async () => {
    if (isStarting) return;
    setIsStarting(true);

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
      setIsStarting(false);
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

    try {
      // 1. Save Setup to LocalStorage (Persistence)
      localStorage.setItem(
        `match_setup_${match.id}`,
        JSON.stringify(setupData)
      );

      // 2. Initialize Timer in LocalStorage (So it starts NOW)
      // Only set if not already set (to avoid resetting if they clicked back and forward)
      if (!localStorage.getItem(`match_timer_${match.id}`)) {
        localStorage.setItem(`match_timer_${match.id}`, Date.now().toString());
      }

      // 3. Update DB Status to LIVE
      const { error } = await supabase
        .from("matches")
        .update({ status: "live" })
        .eq("id", match.id);

      if (error) throw error;

      // 4. Proceed
      onStartMatch(setupData);
    } catch (err: any) {
      toast.error("Failed to start match: " + err.message);
      setIsStarting(false);
    }
  };

  // ... (Rest of the UI rendering remains identical)
  // Just copying the UI parts below to ensure the file is complete

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

  if (step === "team-a") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-6 shadow-lg">
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
              <Shield className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex items-center justify-between pt-10 sm:pt-0">
              <div>
                <h2 className="text-white mb-1">{match.teamA.name}</h2>
                <p className="text-purple-100">
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
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {match.teamA.players.map((player) => {
                  const isSelected = teamASelected.includes(player.id);
                  const isDisabled =
                    !isSelected && teamASelected.length >= playersPerTeam;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors duration-200 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : "border-gray-200"
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
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Back to Matches
                </Button>
                <Button
                  onClick={handleNext}
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

  if (step === "team-b") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-600 to-pink-600 p-6 shadow-lg">
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
              <Shield className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex items-center justify-between pt-10 sm:pt-0">
              <div>
                <h2 className="text-white mb-1">{match.teamB.name}</h2>
                <p className="text-red-100">
                  Select {playersPerTeam} playing players
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <p className="text-white text-sm">Step 2 of 3</p>
              </div>
            </div>
          </div>

          <Card className="shadow-lg border-2 border-red-300">
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" />
                  Player Selection
                </CardTitle>
                <Badge className="bg-red-600">
                  {teamBSelected.length}/{playersPerTeam} Selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {match.teamB.players.map((player) => {
                  const isSelected = teamBSelected.includes(player.id);
                  const isDisabled =
                    !isSelected && teamBSelected.length >= playersPerTeam;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors duration-200 ${
                        isSelected
                          ? "border-red-600 bg-red-50"
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : "border-gray-200"
                      }`}
                      onClick={() =>
                        !isDisabled && handlePlayerToggle(player.id, "B")
                      }
                    >
                      <Checkbox checked={isSelected} disabled={isDisabled} />
                      <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
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
                      )}
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
                  className="flex-1 bg-red-600 hover:bg-red-700"
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
            <Trophy className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between pt-10 sm:pt-0">
            <div>
              <h2 className="text-white mb-1">Match Preview</h2>
              <p className="text-blue-100">
                {match.matchNumber} - {match.tournamentName}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <p className="text-white text-sm">Step 3 of 3</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Team A Preview */}
          <Card className="shadow-lg border-2 border-blue-300">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {match.teamA.name}
              </CardTitle>
              <div className="space-y-1 text-sm">
                <p className="text-blue-700">Captain: {match.teamA.captain}</p>
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
              </div>
            </CardContent>
          </Card>

          {/* Team B Preview */}
          <Card className="shadow-lg border-2 border-red-300">
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-100">
              <CardTitle className="text-red-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {match.teamB.name}
              </CardTitle>
              <div className="space-y-1 text-sm">
                <p className="text-red-700">Captain: {match.teamB.captain}</p>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-2 border-blue-300">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Trophy className="w-5 h-5" />
              Toss & Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
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
                      7 Minutes
                    </Label>
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
                      9 Minutes
                    </Label>
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
                      Custom
                    </Label>
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

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBackStep} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleStartMatch}
            disabled={isStarting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 shadow-lg hover:shadow-xl transition-all text-white"
          >
            {isStarting ? "Starting..." : "Start Match"}
            {!isStarting && <Trophy className="w-5 h-5 mr-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
