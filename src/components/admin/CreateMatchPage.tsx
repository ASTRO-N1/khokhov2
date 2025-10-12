import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ArrowLeft, Calendar, MapPin, Hash } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../supabaseClient";
import { Tournament, Team } from "../../types";

interface CreateMatchPageProps {
  onBack?: () => void;
}

export function CreateMatchPage({ onBack }: CreateMatchPageProps) {
  const [formData, setFormData] = useState({
    tournament_id: "",
    match_number: "",
    team_a_id: "",
    team_b_id: "",
    matchDate: "",
    matchTime: "",
    venue: "",
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("id, name");
      if (tournamentsData) setTournaments(tournamentsData as Tournament[]);
      if (tournamentsError) toast.error("Failed to fetch tournaments.");

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, tournament_id");
      if (teamsData) setAllTeams(teamsData as Team[]);
      if (teamsError) toast.error("Failed to fetch teams.");
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.tournament_id) {
      setFilteredTeams(
        allTeams.filter(
          (team) => (team as any).tournament_id === formData.tournament_id
        )
      );
      setFormData((f) => ({ ...f, team_a_id: "", team_b_id: "" })); // Reset team selection
    } else {
      setFilteredTeams([]);
    }
  }, [formData.tournament_id, allTeams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.tournament_id ||
      !formData.team_a_id ||
      !formData.team_b_id ||
      !formData.matchDate ||
      !formData.matchTime ||
      !formData.venue
    ) {
      toast.error("Please fill out all required fields.");
      return;
    }
    if (formData.team_a_id === formData.team_b_id) {
      toast.error("Team A and Team B cannot be the same.");
      return;
    }
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to create a match.");
      setLoading(false);
      return;
    }

    const matchDateTime = new Date(
      `${formData.matchDate}T${formData.matchTime}`
    ).toISOString();

    const { error } = await supabase.from("matches").insert({
      tournament_id: formData.tournament_id,
      match_number: formData.match_number,
      team_a_id: formData.team_a_id,
      team_b_id: formData.team_b_id,
      match_datetime: matchDateTime,
      venue: formData.venue,
      user_id: user.id,
    });

    setLoading(false);

    if (error) {
      toast.error(`Error creating match: ${error.message}`);
    } else {
      toast.success("Match created successfully!");
      setFormData({
        tournament_id: "",
        match_number: "",
        team_a_id: "",
        team_b_id: "",
        matchDate: "",
        matchTime: "",
        venue: "",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-gray-900 mb-1">Create Match</h2>
        <p className="text-gray-600">Schedule a new match for the tournament</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tournament">Tournament *</Label>
                <Select
                  value={formData.tournament_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tournament_id: value })
                  }
                >
                  <SelectTrigger
                    id="tournament"
                    className="border-gray-300 rounded-lg"
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
                <Label htmlFor="matchNumber">Match Number (e.g., M001)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="matchNumber"
                    value={formData.match_number}
                    onChange={(e) =>
                      setFormData({ ...formData, match_number: e.target.value })
                    }
                    placeholder="e.g., M001, SemiFinal-1"
                    className="pl-10 border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamA">Team A *</Label>
                <Select
                  value={formData.team_a_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, team_a_id: value })
                  }
                  disabled={!formData.tournament_id}
                >
                  <SelectTrigger
                    id="teamA"
                    className="border-gray-300 rounded-lg"
                  >
                    <SelectValue placeholder="Select Team A" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamB">Team B *</Label>
                <Select
                  value={formData.team_b_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, team_b_id: value })
                  }
                  disabled={!formData.tournament_id}
                >
                  <SelectTrigger
                    id="teamB"
                    className="border-gray-300 rounded-lg"
                  >
                    <SelectValue placeholder="Select Team B" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeams
                      .filter((t) => t.id !== formData.team_a_id)
                      .map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matchDate">Match Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="matchDate"
                    type="date"
                    value={formData.matchDate}
                    onChange={(e) =>
                      setFormData({ ...formData, matchDate: e.target.value })
                    }
                    className="pl-10 border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="matchTime">Match Time *</Label>
                <Input
                  id="matchTime"
                  type="time"
                  value={formData.matchTime}
                  onChange={(e) =>
                    setFormData({ ...formData, matchTime: e.target.value })
                  }
                  className="border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ground">Ground / Venue *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="ground"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  placeholder="Enter ground/venue name"
                  className="pl-10 border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Match"}
              </Button>
              {onBack && (
                <Button
                  type="button"
                  onClick={onBack}
                  variant="secondary"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
