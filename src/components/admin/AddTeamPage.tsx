import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Users, Upload, Plus, X, Save, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { supabase } from "../../supabaseClient";
import Papa from "papaparse";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tournament } from "../../types";

interface Player {
  name: string;
  jerseyNumber: number;
}

export function AddTeamPage() {
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainJersey, setCaptainJersey] = useState("");
  const [coach, setCoach] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState({
    name: "",
    jerseyNumber: "",
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name");
      if (error) {
        toast.error("Failed to fetch tournaments.");
      } else {
        setTournaments(data as Tournament[]);
      }
    };
    fetchTournaments();
  }, []);

  useEffect(() => {
    const jerseyNum = parseInt(captainJersey);
    if (captainName && !isNaN(jerseyNum) && jerseyNum > 0) {
      const captainAsPlayer: Player = {
        name: captainName,
        jerseyNumber: jerseyNum,
      };
      const otherPlayers = players.filter((p) => p.jerseyNumber !== jerseyNum);
      setPlayers([captainAsPlayer, ...otherPlayers]);
    }
  }, [captainName, captainJersey]);

  const handleAddPlayer = () => {
    if (!currentPlayer.name || !currentPlayer.jerseyNumber) {
      toast.error("Please enter player name and jersey number.");
      return;
    }
    const jerseyNum = parseInt(currentPlayer.jerseyNumber);
    if (isNaN(jerseyNum) || jerseyNum < 1) {
      toast.error("Please enter a valid jersey number.");
      return;
    }
    if (players.some((p) => p.jerseyNumber === jerseyNum)) {
      toast.error("Jersey number already exists for this team.");
      return;
    }
    setPlayers([
      ...players,
      { name: currentPlayer.name, jerseyNumber: jerseyNum },
    ]);
    setCurrentPlayer({ name: "", jerseyNumber: "" });
    toast.success(`Player #${jerseyNum} added.`);
  };

  const handleRemovePlayer = (jerseyNumber: number) => {
    const captainJerseyNum = parseInt(captainJersey);
    if (jerseyNumber === captainJerseyNum) {
      toast.error(
        "You cannot remove the captain. Change the captain's details above."
      );
      return;
    }
    setPlayers(players.filter((p) => p.jerseyNumber !== jerseyNumber));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newPlayers: Player[] = [];
        const existingJerseys = new Set(players.map((p) => p.jerseyNumber));
        let addedCount = 0;

        results.data.forEach((row: any) => {
          const name = row["Player Name"] || row["name"];
          const jerseyStr = row["Jersey Number"] || row["jerseyNumber"];
          if (name && jerseyStr) {
            const jerseyNumber = parseInt(jerseyStr);
            if (!isNaN(jerseyNumber) && !existingJerseys.has(jerseyNumber)) {
              newPlayers.push({ name, jerseyNumber });
              existingJerseys.add(jerseyNumber);
              addedCount++;
            }
          }
        });
        setPlayers((prevPlayers) => [...prevPlayers, ...newPlayers]);
        toast.success(`${addedCount} players successfully imported from CSV.`);
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
      },
    });
    e.target.value = "";
  };

  const handleReset = () => {
    setTeamName("");
    setCaptainName("");
    setCaptainJersey("");
    setCoach("");
    setPlayers([]);
    setCurrentPlayer({ name: "", jerseyNumber: "" });
    setSelectedTournamentId("");
    toast.info("Form has been reset.");
  };

  const handleSubmit = async () => {
    const captainJerseyNum = parseInt(captainJersey);
    if (!selectedTournamentId) {
      toast.error("Please select a tournament for this team.");
      return;
    }
    if (
      !teamName ||
      !captainName ||
      isNaN(captainJerseyNum) ||
      captainJerseyNum < 1 ||
      players.length < 9
    ) {
      toast.error(
        "Please fill team name, captain details, and add at least 9 players."
      );
      return;
    }
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to create a team.");
      setLoading(false);
      return;
    }

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: teamName,
        captain_name: captainName,
        coach_name: coach,
        user_id: user.id,
        tournament_id: selectedTournamentId,
      })
      .select("id")
      .single();

    if (teamError || !teamData) {
      toast.error(`Failed to create team: ${teamError?.message}`);
      setLoading(false);
      return;
    }

    const playersToInsert = players.map((player) => ({
      name: player.name,
      jersey_number: player.jerseyNumber,
      team_id: teamData.id,
      user_id: user.id,
    }));

    const { data: insertedPlayers, error: playerError } = await supabase
      .from("players")
      .insert(playersToInsert)
      .select("id, name");

    if (playerError || !insertedPlayers) {
      toast.error(`Failed to add players: ${playerError.message}`);
      await supabase.from("teams").delete().eq("id", teamData.id);
      setLoading(false);
      return;
    }

    const captainRecord = insertedPlayers.find((p) => p.name === captainName);
    if (captainRecord) {
      const { error: updateError } = await supabase
        .from("teams")
        .update({ captain_id: captainRecord.id })
        .eq("id", teamData.id);
      if (updateError) {
        toast.error(`Failed to link captain: ${updateError.message}`);
      }
    }

    toast.success("Team and players added successfully!");
    handleReset();
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-gray-900 mb-1">Add Team</h2>
        <p className="text-gray-600">
          Register a new team with players for a specific tournament
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tournament">Tournament *</Label>
              <Select
                value={selectedTournamentId}
                onValueChange={setSelectedTournamentId}
              >
                <SelectTrigger
                  id="tournament"
                  className="border-gray-300 rounded-lg h-10"
                >
                  <SelectValue placeholder="Select tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="captain">Captain Name *</Label>
                <Input
                  id="captain"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="Enter captain name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="captainJersey">Captain Jersey No. *</Label>
                <Input
                  id="captainJersey"
                  type="number"
                  value={captainJersey}
                  onChange={(e) => setCaptainJersey(e.target.value)}
                  placeholder="e.g., 7"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach">Coach Name</Label>
              <Input
                id="coach"
                value={coach}
                onChange={(e) => setCoach(e.target.value)}
                placeholder="Enter coach name"
              />
            </div>
            <div className="pt-2">
              <p className="text-sm text-gray-600">
                Total Players:{" "}
                <span className="font-medium">{players.length}</span>
                {players.length < 9 && (
                  <span className="text-red-600 ml-2">
                    (Minimum 9 required)
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add Players</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Player Name</Label>
                  <Input
                    id="playerName"
                    value={currentPlayer.name}
                    onChange={(e) =>
                      setCurrentPlayer({
                        ...currentPlayer,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter player name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jerseyNumber">Jersey Number</Label>
                  <Input
                    id="jerseyNumber"
                    type="number"
                    min="1"
                    max="99"
                    value={currentPlayer.jerseyNumber}
                    onChange={(e) =>
                      setCurrentPlayer({
                        ...currentPlayer,
                        jerseyNumber: e.target.value,
                      })
                    }
                    placeholder="Enter jersey number"
                  />
                </div>
                <Button
                  onClick={handleAddPlayer}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              </TabsContent>
              <TabsContent value="csv" className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">
                    Upload CSV file with player details.
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csvUpload"
                  />
                  <Label
                    htmlFor="csvUpload"
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Label>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">
                    CSV Format (headers must match):
                  </p>
                  <code className="text-xs text-gray-800">
                    "Player Name","Jersey Number"
                    <br />
                    "John Doe",7
                    <br />
                    "Jane Smith",12
                  </code>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      {players.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Roster ({players.length} Players)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {players
                .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
                .map((player) => (
                  <div
                    key={player.jerseyNumber}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        {player.jerseyNumber}
                      </div>
                      <div>
                        <p className="text-sm">{player.name}</p>
                        {player.name === captainName && (
                          <Badge className="bg-yellow-600 text-xs mt-1">
                            Captain
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlayer(player.jerseyNumber)}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving Team..." : "Save Team"}
        </Button>
        <Button onClick={handleReset} variant="secondary" disabled={loading}>
          Reset
        </Button>
      </div>
    </div>
  );
}
