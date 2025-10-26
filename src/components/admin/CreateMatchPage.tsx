import { useState, useEffect } from "react";
import MuiInputAdornment from "@mui/material/InputAdornment";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Clock } from "lucide-react";
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
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Hash,
} from "lucide-react"; // Renamed icon
import { toast } from "sonner";
import { supabase } from "../../supabaseClient";
import { Tournament, Team } from "../../types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"; // Import Popover
import { Calendar } from "../ui/calendar"; // Import Calendar
import { cn } from "../ui/utils"; // Import cn
import { format, parseISO } from "date-fns"; // Import date-fns
import dayjs, { Dayjs } from "dayjs"; // Import Dayjs type
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
interface CreateMatchPageProps {
  onBack?: () => void;
}

export function CreateMatchPage({ onBack }: CreateMatchPageProps) {
  const [formData, setFormData] = useState({
    tournament_id: "",
    match_number: "",
    team_a_id: "",
    team_b_id: "",
    matchDate: "", // Keep this to store the string YYYY-MM-DD
    matchTime: "",
    venue: "",
  });
  // New state for the Date object used by the Calendar component
  const [matchTimeValue, setMatchTimeValue] = useState<Dayjs | null>(null);
  const [matchDateObj, setMatchDateObj] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false); // State for popover

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // ... fetch tournaments and teams (no changes here) ...
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("id, name");
      if (tournamentsData) setTournaments(tournamentsData as Tournament[]);
      if (tournamentsError) toast.error("Failed to fetch tournaments.");

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, tournament_id"); // Make sure tournament_id is selected
      if (teamsData) setAllTeams(teamsData as Team[]);
      if (teamsError) toast.error("Failed to fetch teams.");
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.tournament_id) {
      // Ensure team type includes tournament_id or adjust casting
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

  // Handler for when a date is selected in the calendar
  const handleMatchDateSelect = (date: Date | undefined) => {
    if (date) {
      setMatchDateObj(date);
      setFormData({ ...formData, matchDate: format(date, "yyyy-MM-dd") });
      setIsDatePickerOpen(false); // Close popover on select
    } else {
      setMatchDateObj(undefined);
      setFormData({ ...formData, matchDate: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const timeString = matchTimeValue ? matchTimeValue.format("HH:mm") : null;
    if (
      !formData.tournament_id ||
      !formData.team_a_id ||
      !formData.team_b_id ||
      !formData.matchDate ||
      !timeString || // Check the string date
      !formData.matchTime ||
      !formData.venue
    ) {
      toast.error("Please fill out all required fields.");
      return;
    }
    // ... rest of handleSubmit (no changes needed here) ...
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
      `${formData.matchDate}T${timeString}`
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
        // Reset form
        tournament_id: "",
        match_number: "",
        team_a_id: "",
        team_b_id: "",
        matchDate: "",
        matchTime: "",
        venue: "",
      });
      setMatchDateObj(undefined);
      setMatchTimeValue(null); // Reset calendar date object
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
              {/* Tournament Select (no changes) */}
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
              {/* Match Number Input (no changes) */}
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
            {/* Team Selects (no changes) */}
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
            {/* --- UPDATED DATE & TIME PICKERS --- */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matchDate">Match Date *</Label>
                <Popover
                  open={isDatePickerOpen}
                  onOpenChange={setIsDatePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal border-gray-300 rounded-lg",
                        !matchDateObj && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {matchDateObj ? (
                        format(matchDateObj, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={matchDateObj}
                      onSelect={handleMatchDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Time Picker - Corrected Again */}
              <div className="space-y-2">
                <Label htmlFor="matchTime">Match Time *</Label>
                <MobileTimePicker
                  value={matchTimeValue} // Main value prop expects Dayjs | null
                  onChange={(newValue) => setMatchTimeValue(newValue)}
                  ampm={true}
                  label=""
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      required: true,
                      inputProps: {
                        readOnly: true,
                        style: { cursor: "pointer" },
                      },
                      InputProps: {
                        readOnly: true,
                        startAdornment: (
                          <MuiInputAdornment position="start">
                            <Clock className="h-4 w-4 text-gray-500" />
                          </MuiInputAdornment>
                        ),
                        onClick: (e) => {
                          const button = (
                            e.currentTarget as HTMLElement
                          ).querySelector("button");
                          button?.click();
                        },
                        style: { cursor: "pointer" },
                      },
                      // Use placeholder for the empty state text
                      placeholder: "Pick a time",
                      sx: {
                        // Keep your styling
                        "& .MuiInputBase-root": {
                          cursor: "pointer",
                          height: "40px",
                          borderRadius: "0.375rem",
                          backgroundColor: "var(--background)",
                          borderColor: "var(--border)",
                          color: matchTimeValue
                            ? "var(--foreground)"
                            : "var(--muted-foreground)", // Color logic still works
                          boxShadow: "none",
                          fontSize: "0.875rem",
                          justifyContent: "flex-start",
                          paddingLeft: "0.75rem",
                          paddingRight: "0.75rem",
                          "& .MuiInputAdornment-root": {
                            marginRight: "8px",
                            color: "var(--muted-foreground)",
                          },
                          "& input": {
                            paddingLeft: 0,
                            cursor: "pointer",
                          },
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--border)",
                        },
                        "&:hover .MuiInputBase-root": {
                          // Apply hover bg to root
                          backgroundColor: "var(--accent)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--ring)",
                          borderWidth: "1px",
                        },
                      },
                      // REMOVED explicit value prop here
                    },
                    dialog: {
                      TransitionProps: {
                        timeout: 500,
                      },
                    },
                  }}
                />
              </div>
            </div>
            {/* --- END OF UPDATES --- */}

            {/* Venue Input (no changes) */}
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
            {/* Buttons (no changes) */}
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
