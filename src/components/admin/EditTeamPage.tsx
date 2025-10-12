import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Users, Plus, X, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Badge } from "../ui/badge";
import { supabase } from "../../supabaseClient";
import { Player as PlayerType } from "../../types";

interface EditTeamPageProps {
  teamId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function EditTeamPage({ teamId, onBack, onSuccess }: EditTeamPageProps) {
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [coach, setCoach] = useState("");
  const [players, setPlayers] = useState<PlayerType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState({
    name: "",
    jerseyNumber: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();

      if (teamError || !teamData) {
        toast.error("Failed to fetch team data.");
        onBack();
        return;
      }

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamId);

      if (playersError) {
        toast.error("Failed to fetch player data.");
      } else {
        setTeamName(teamData.name);
        setCaptainName(teamData.captain_name);
        setCoach(teamData.coach_name || "");
        setPlayers(
          playersData.map((p) => ({
            id: p.id,
            name: p.name,
            jerseyNumber: p.jersey_number,
            teamId: p.team_id,
            role: "playing", // Default value
            isActive: true, // Default value
          }))
        );
      }
      setLoading(false);
    };

    fetchTeamData();
  }, [teamId, onBack]);

  const handleAddPlayer = async () => {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not logged in.");
      return;
    }

    const { data: newPlayer, error } = await supabase
      .from("players")
      .insert({
        name: currentPlayer.name,
        jersey_number: jerseyNum,
        team_id: teamId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !newPlayer) {
      toast.error(`Failed to add player: ${error?.message}`);
    } else {
      setPlayers([
        ...players,
        {
          id: newPlayer.id,
          name: newPlayer.name,
          jerseyNumber: newPlayer.jersey_number,
          teamId: newPlayer.team_id,
          role: "playing",
          isActive: true,
        },
      ]);
      setCurrentPlayer({ name: "", jerseyNumber: "" });
      toast.success("Player added successfully!");
    }
  };

  const handleRemovePlayer = async (playerToRemove: PlayerType) => {
    if (playerToRemove.name === captainName) {
      toast.error("You cannot remove the captain. Change the captain first.");
      return;
    }
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerToRemove.id);

    if (error) {
      toast.error(`Failed to remove player: ${error.message}`);
    } else {
      setPlayers(players.filter((p) => p.id !== playerToRemove.id));
      toast.success(`Player "${playerToRemove.name}" removed.`);
    }
  };

  const handleUpdateTeam = async () => {
    if (!teamName || !captainName) {
      toast.error("Team name and captain name are required.");
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from("teams")
      .update({
        name: teamName,
        captain_name: captainName,
        coach_name: coach,
      })
      .eq("id", teamId);

    setLoading(false);
    if (error) {
      toast.error(`Failed to update team: ${error.message}`);
    } else {
      toast.success("Team details updated successfully!");
      onSuccess();
    }
  };

  if (loading) {
    return <div className="p-4">Loading team details...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-gray-900 mb-1">Edit Team</h2>
        <p className="text-gray-600">Update team details and manage players.</p>
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
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>
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
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add a New Player</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                value={currentPlayer.name}
                onChange={(e) =>
                  setCurrentPlayer({ ...currentPlayer, name: e.target.value })
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
          </CardContent>
        </Card>
      </div>

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
                  key={player.id}
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
                    onClick={() => handleRemovePlayer(player)}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleUpdateTeam}
          className="bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button onClick={onBack} variant="secondary" disabled={loading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teams
        </Button>
      </div>
    </div>
  );
}
