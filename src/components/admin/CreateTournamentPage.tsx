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
import { Calendar as CalendarIcon, ArrowLeft, Users } from "lucide-react"; // Renamed Calendar icon import
import { toast } from "sonner";
import { supabase } from "../../supabaseClient";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"; // Import Popover components
import { Calendar } from "../ui/calendar"; // Import Calendar component
import { cn } from "../ui/utils"; // Import cn utility
import { format, parseISO } from "date-fns"; // Import date-fns functions

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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  // Add state for popover open/close
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

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
          // Set initial dates for the calendar pickers if they exist
          if (data.start_date) {
            try {
              setStartDate(parseISO(data.start_date));
            } catch (e) {
              console.error("Error parsing start date:", data.start_date, e);
              // Optionally set to undefined or show an error
              setStartDate(undefined);
            }
          }
          if (data.end_date) {
            try {
              setEndDate(parseISO(data.end_date));
            } catch (e) {
              console.error("Error parsing end date:", data.end_date, e);
              setEndDate(undefined);
            }
          }
        }
        setLoading(false);
      };
      fetchTournamentData();
    }
  }, [tournamentId, isEditMode]);

  const substitutePlayers = 15 - parseInt(formData.playing_players || "7");

  // Updated handler
  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      setFormData({ ...formData, start_date: format(date, "yyyy-MM-dd") });
      // Ensure end date is not before start date
      if (endDate && date > endDate) {
        setEndDate(date);
        setFormData({ ...formData, end_date: format(date, "yyyy-MM-dd") });
      }
      setIsStartDatePickerOpen(false); // Close the popover
    } else {
      setStartDate(undefined);
      setFormData({ ...formData, start_date: "" });
    }
  };

  // Updated handler
  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
      setFormData({ ...formData, end_date: format(date, "yyyy-MM-dd") });
      setIsEndDatePickerOpen(false); // Close the popover
    } else {
      setEndDate(undefined);
      setFormData({ ...formData, end_date: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      toast.error("Please select both a start and end date.");
      return;
    }
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
      const { error: updateError } = await supabase
        .from("tournaments")
        .update(submissionData)
        .eq("id", tournamentId);
      error = updateError;
    } else {
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
      if (onSuccess) onSuccess();
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

              {/* --- UPDATED DATE PICKERS WITH POPOVER CONTROL --- */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover
                    open={isStartDatePickerOpen}
                    onOpenChange={setIsStartDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-10 justify-start text-left font-normal border-gray-300 rounded-lg",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleStartDateSelect} // Use updated handler
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover
                    open={isEndDatePickerOpen}
                    onOpenChange={setIsEndDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-10 justify-start text-left font-normal border-gray-300 rounded-lg",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={!startDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={handleEndDateSelect} // Use updated handler
                        disabled={{ before: startDate }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* --- END OF UPDATED DATE PICKERS --- */}

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
