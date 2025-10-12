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
import { Calendar, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { supabase } from "../../supabaseClient";

interface CreateTournamentPageProps {
  tournamentId?: string; // Make tournamentId an optional prop
  onBack?: () => void;
  onSuccess?: () => void;
}

export function CreateTournamentPage({
  tournamentId,
  onBack,
  onSuccess,
}: CreateTournamentPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    tournament_type: "",
    level: "",
    session: "",
    section: "",
    category: "",
    start_date: "",
    end_date: "",
    venue: "",
    organizer_name: "",
    playing_players: "7",
  });
  const [loading, setLoading] = useState(false);
  const isEditMode = !!tournamentId;

  useEffect(() => {
    if (isEditMode) {
      const fetchTournamentData = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", tournamentId)
          .single(); // Use .single() to get one record

        if (error) {
          toast.error(`Error fetching tournament data: ${error.message}`);
        } else if (data) {
          setFormData({
            name: data.name || "",
            tournament_type: data.tournament_type?.toLowerCase() || "",
            level: data.level?.toLowerCase() || "",
            session: data.session || "",
            section: data.section || "",
            category: data.category || "",
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            venue: data.venue || "",
            organizer_name: data.organizer_name || "",
            playing_players: data.playing_players?.toString() || "7",
          });
        }
        setLoading(false);
      };
      fetchTournamentData();
    }
  }, [tournamentId, isEditMode]);

  const substitutePlayers = 15 - parseInt(formData.playing_players || "7");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in.");
      setLoading(false);
      return;
    }

    const formattedLevel =
      formData.level.charAt(0).toUpperCase() + formData.level.slice(1);
    const formattedTournamentType =
      formData.tournament_type.charAt(0).toUpperCase() +
      formData.tournament_type.slice(1);

    const submissionData = {
      name: formData.name,
      tournament_type: formattedTournamentType,
      level: formattedLevel,
      session: formData.session,
      section: formData.section,
      category: formData.category,
      start_date: formData.start_date,
      end_date: formData.end_date,
      venue: formData.venue,
      organizer_name: formData.organizer_name,
      playing_players: parseInt(formData.playing_players),
      user_id: user.id,
    };

    let error;
    if (isEditMode) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("tournaments")
        .update(submissionData)
        .eq("id", tournamentId);
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("tournaments")
        .insert([submissionData]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.success(
        `Tournament ${isEditMode ? "updated" : "created"} successfully!`
      );
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-gray-900 mb-1">
          {isEditMode ? "Edit Tournament" : "Create Tournament"}
        </h2>
        <p className="text-gray-600">
          {isEditMode
            ? "Update the details for this tournament."
            : "Set up a new Kho-Kho tournament"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && isEditMode ? (
            <p>Loading tournament data...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter tournament name"
                  className="border-gray-300 rounded-lg h-10"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tournament Type</Label>
                  <Select
                    value={formData.tournament_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tournament_type: value })
                    }
                  >
                    <SelectTrigger
                      id="type"
                      className="border-gray-300 rounded-lg h-10"
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="league">League</SelectItem>
                      <SelectItem value="knockout">Knockout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Tournament Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: value })
                    }
                  >
                    <SelectTrigger
                      id="level"
                      className="border-gray-300 rounded-lg h-10"
                    >
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="district">District</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session">Session</Label>
                  <Select
                    value={formData.session}
                    onValueChange={(value) =>
                      setFormData({ ...formData, session: value })
                    }
                  >
                    <SelectTrigger
                      id="session"
                      className="border-gray-300 rounded-lg h-10"
                    >
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Select
                    value={formData.section}
                    onValueChange={(value) =>
                      setFormData({ ...formData, section: value })
                    }
                  >
                    <SelectTrigger
                      id="section"
                      className="border-gray-300 rounded-lg h-10"
                    >
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="sub-junior">Sub-Junior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger
                      id="category"
                      className="border-gray-300 rounded-lg h-10"
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="boys">Boys</SelectItem>
                      <SelectItem value="girls">Girls</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="pl-10 border-gray-300 rounded-lg h-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="pl-10 border-gray-300 rounded-lg h-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    placeholder="Enter venue"
                    className="border-gray-300 rounded-lg h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizer">Organizer Name</Label>
                  <Input
                    id="organizer"
                    value={formData.organizer_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organizer_name: e.target.value,
                      })
                    }
                    placeholder="Enter organizer name"
                    className="border-gray-300 rounded-lg h-10"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="playingPlayers">Playing Players</Label>
                  <Select
                    value={formData.playing_players}
                    onValueChange={(value) =>
                      setFormData({ ...formData, playing_players: value })
                    }
                  >
                    <SelectTrigger
                      id="playingPlayers"
                      className="border-gray-300 rounded-lg h-10"
                    >
                      <SelectValue placeholder="Select playing players" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Players</SelectItem>
                      <SelectItem value="9">9 Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="substitutePlayers">Substitute Players</Label>
                  <div className="h-10 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-lg flex items-center text-gray-700">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">{substitutePlayers}</span>
                    <span className="ml-1 text-gray-500 text-sm">
                      Players (Auto-calculated)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : isEditMode
                    ? "Save Changes"
                    : "Save Tournament"}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
