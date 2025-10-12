import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Users, ArrowRight, Check, Trophy, Shield, User } from "lucide-react";
import { Match, Player } from "../../types";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

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
  const [step, setStep] = useState<"config" | "team-a" | "team-b" | "preview">(
    "config"
  );
  const [playersPerTeam, setPlayersPerTeam] = useState<7 | 9>(7);
  const [teamASelected, setTeamASelected] = useState<string[]>([]);
  const [teamBSelected, setTeamBSelected] = useState<string[]>([]);
  const [tossWinner, setTossWinner] = useState<"A" | "B">("A");
  const [tossDecision, setTossDecision] = useState<"attack" | "defend">(
    "attack"
  );
  const [timerOption, setTimerOption] = useState<"7" | "9" | "custom">("7");
  const [customTimerMinutes, setCustomTimerMinutes] = useState<string>("7");

  const handlePlayerToggle = (playerId: string, team: "A" | "B") => {
    if (team === "A") {
      if (teamASelected.includes(playerId)) {
        setTeamASelected(teamASelected.filter((id) => id !== playerId));
      } else if (teamASelected.length < playersPerTeam) {
        setTeamASelected([...teamASelected, playerId]);
      }
    } else {
      if (teamBSelected.includes(playerId)) {
        setTeamBSelected(teamBSelected.filter((id) => id !== playerId));
      } else if (teamBSelected.length < playersPerTeam) {
        setTeamBSelected([...teamBSelected, playerId]);
      }
    }
  };

  const handleNext = () => {
    if (step === "config") {
      setStep("team-a");
    } else if (step === "team-a") {
      setStep("team-b");
    } else if (step === "team-b") {
      setStep("preview");
    }
  };

  const handleBackStep = () => {
    if (step === "team-a") {
      setStep("config");
    } else if (step === "team-b") {
      setStep("team-a");
    } else if (step === "preview") {
      setStep("team-b");
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

    // Calculate timer duration in seconds
    let timerDuration = 0;
    if (timerOption === "7") {
      timerDuration = 7 * 60; // 7 minutes
    } else if (timerOption === "9") {
      timerDuration = 9 * 60; // 9 minutes
    } else {
      timerDuration = parseInt(customTimerMinutes) * 60; // custom minutes
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

  // Configuration Step
  if (step === "config") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
              <Trophy className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10">
              <h2 className="text-white mb-1">Match Setup</h2>
              <p className="text-blue-100">
                {match.matchNumber} - {match.tournamentName}
              </p>
            </div>
          </div>

          {/* Configuration Card */}
          <Card className="shadow-lg border-2 border-blue-200">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="w-5 h-5" />
                Match Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Select the number of playing players per team
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-gray-700">
                    Playing Players Per Team
                  </Label>
                  <RadioGroup
                    value={playersPerTeam.toString()}
                    onValueChange={(val) =>
                      setPlayersPerTeam(parseInt(val) as 7 | 9)
                    }
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`relative flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          playersPerTeam === 7
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => setPlayersPerTeam(7)}
                      >
                        <RadioGroupItem value="7" id="7-players" />
                        <Label
                          htmlFor="7-players"
                          className="flex-1 cursor-pointer"
                        >
                          <p className="font-medium text-gray-900">7 Players</p>
                          <p className="text-sm text-gray-500">
                            Standard format
                          </p>
                        </Label>
                        {playersPerTeam === 7 && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>

                      <div
                        className={`relative flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          playersPerTeam === 9
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => setPlayersPerTeam(9)}
                      >
                        <RadioGroupItem value="9" id="9-players" />
                        <Label
                          htmlFor="9-players"
                          className="flex-1 cursor-pointer"
                        >
                          <p className="font-medium text-gray-900">9 Players</p>
                          <p className="text-sm text-gray-500">
                            Extended format
                          </p>
                        </Label>
                        {playersPerTeam === 9 && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Playing:</strong> {playersPerTeam} players per team
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>Substitutes:</strong>{" "}
                    {match.teamA.players.length - playersPerTeam} players per
                    team
                  </p>
                </div>

                <Button
                  onClick={handleNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 shadow-md hover:shadow-lg transition-all"
                  size="lg"
                >
                  Next - Select {match.teamA.name} Players
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Team A Selection
  if (step === "team-a") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header - Highlighted with Different Color */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-6 shadow-lg">
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
              <Shield className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-white mb-1">{match.teamA.name}</h2>
                <p className="text-blue-100">
                  Select {playersPerTeam} playing players
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <p className="text-white text-sm">Step 2 of 4</p>
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
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Captain: {match.teamA.captain}
                  </span>
                </div>
                {match.teamA.coach && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      Coach: {match.teamA.coach}
                    </span>
                  </div>
                )}
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
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
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
                <Button
                  variant="outline"
                  onClick={handleBackStep}
                  className="flex-1"
                >
                  Back
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

  // Team B Selection
  if (step === "team-b") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header - Highlighted with Different Color */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-6 shadow-lg">
            <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
              <Shield className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-white mb-1">{match.teamB.name}</h2>
                <p className="text-red-100">
                  Select {playersPerTeam} playing players
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <p className="text-white text-sm">Step 3 of 4</p>
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
                  {teamBSelected.length}/{playersPerTeam} Selected
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Captain: {match.teamB.captain}
                  </span>
                </div>
                {match.teamB.coach && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      Coach: {match.teamB.coach}
                    </span>
                  </div>
                )}
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
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-red-600 bg-red-50"
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                          : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                      }`}
                      onClick={() =>
                        !isDisabled && handlePlayerToggle(player.id, "B")
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
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
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

  // Preview
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
        {/* Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
            <Trophy className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-white mb-1">Match Preview</h2>
              <p className="text-blue-100">
                {match.matchNumber} - {match.tournamentName}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <p className="text-white text-sm">Step 4 of 4</p>
            </div>
          </div>
        </div>

        {/* Team Lineups */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-2 border-blue-300">
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Playing {playersPerTeam}
                    </h3>
                    <Badge className="bg-blue-600">{teamAPlaying.length}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {teamAPlaying.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-300 rounded-lg"
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Substitutes
                    </h3>
                    <Badge variant="secondary">{teamASubstitutes.length}</Badge>
                  </div>
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

          <Card className="shadow-lg border-2 border-blue-300">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {match.teamB.name}
              </CardTitle>
              <div className="space-y-1 text-sm">
                <p className="text-blue-700">Captain: {match.teamB.captain}</p>
                {match.teamB.coach && (
                  <p className="text-blue-700">Coach: {match.teamB.coach}</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Playing {playersPerTeam}
                    </h3>
                    <Badge className="bg-blue-600">{teamBPlaying.length}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {teamBPlaying.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-300 rounded-lg"
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Substitutes
                    </h3>
                    <Badge variant="secondary">{teamBSubstitutes.length}</Badge>
                  </div>
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

        {/* Toss Details & Timer Configuration */}
        <Card className="shadow-lg border-2 border-blue-300">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Trophy className="w-5 h-5" />
              Toss Details & Timer Configuration
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
                  <SelectTrigger className="border-blue-300 rounded-lg h-11 hover:border-blue-500 transition-colors bg-white">
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
                  <SelectTrigger className="border-blue-300 rounded-lg h-11 hover:border-blue-500 transition-colors bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attack">Attack First</SelectItem>
                    <SelectItem value="defend">Defend First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg mb-6">
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
                    className="border-blue-300 rounded-lg h-11 hover:border-blue-500 transition-colors"
                    placeholder="Enter minutes"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Start Match */}
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
