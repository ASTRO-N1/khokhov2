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
import { Badge } from "../ui/badge";
import {
  UserPlus,
  Users,
  X,
  Plus,
  Mail,
  Phone,
  User,
  Lock,
  Trash2, // Added Trash2 icon
  AlertCircle, // Added AlertCircle icon
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { supabase } from "../../supabaseClient";

interface ScorerProfile {
  id: string;
  name: string;
  email: string;
  contact_number: string;
}

interface Assignment {
  id: string;
  tournamentName: string;
  matchNumber: string;
  scorerName: string;
  dateTime: string;
}

export function ScorerManagementPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for delete confirmation dialog
  const [scorerToDelete, setScorerToDelete] = useState<ScorerProfile | null>(
    null
  ); // State to hold scorer data for deletion

  const [newScorer, setNewScorer] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
  });
  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedMatch, setSelectedMatch] = useState("");
  const [selectedScorer, setSelectedScorer] = useState("");

  const [tournaments, setTournaments] = useState<
    { id: string; name: string }[]
  >([]);
  const [matches, setMatches] = useState<
    { id: string; match_number: string; tournament_id: string }[]
  >([]);
  const [scorers, setScorers] = useState<ScorerProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    const tournamentsPromise = supabase.from("tournaments").select("id, name");
    const matchesPromise = supabase
      .from("matches")
      .select("id, match_number, tournament_id");

    const [tournamentsResult, matchesResult] = await Promise.all([
      tournamentsPromise,
      matchesPromise,
    ]);

    if (tournamentsResult.data) setTournaments(tournamentsResult.data);
    if (matchesResult.data) setMatches(matchesResult.data);

    await fetchScorersAndAssignments();
    setLoading(false);
  }

  async function fetchScorersAndAssignments() {
    const scorersPromise = supabase
      .from("profiles")
      .select("id, name, email, contact_number")
      .eq("role", "scorer");
    const assignmentsPromise = supabase
      .from("matches")
      .select(
        `id, match_number, match_datetime, tournaments ( name ), scorer:profiles ( name )`
      )
      .not("scorer_id", "is", null);

    const [scorersResult, assignmentsResult] = await Promise.all([
      scorersPromise,
      assignmentsPromise,
    ]);

    if (scorersResult.error) {
      toast.error("Failed to fetch scorers: " + scorersResult.error.message);
    } else if (scorersResult.data) {
      setScorers(scorersResult.data as ScorerProfile[]);
    }

    if (assignmentsResult.error) {
      toast.error(
        "Failed to fetch assignments: " + assignmentsResult.error.message
      );
    } else if (assignmentsResult.data) {
      const formattedAssignments = assignmentsResult.data.map((a: any) => ({
        id: a.id,
        tournamentName: a.tournaments.name,
        matchNumber: a.match_number || "N/A",
        scorerName: a.scorer.name,
        dateTime: new Date(a.match_datetime).toLocaleString(),
      }));
      setAssignments(formattedAssignments);
    }
  }

  const handleCreateScorer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !newScorer.name ||
      !newScorer.email ||
      !newScorer.contact ||
      !newScorer.password
    ) {
      toast.error("Please fill all fields, including password.");
      return;
    }

    // Call Edge Function to safely create user on the server
    const { data: edgeFunctionData, error: edgeFunctionError } =
      await supabase.functions.invoke("create-user", {
        body: {
          email: newScorer.email,
          password: newScorer.password,
          name: newScorer.name,
          contact_number: newScorer.contact,
          role: "scorer",
        },
      });

    if (edgeFunctionError) {
      toast.error(`Error calling function: ${edgeFunctionError.message}`);
      return;
    }

    // Check for application-level errors from the Edge Function
    if (edgeFunctionData.error) {
      const message = String(edgeFunctionData.error).includes(
        "User already registered"
      )
        ? "A scorer with this email already exists."
        : `Failed to create user: ${edgeFunctionData.error}`;
      toast.error(message);
      return;
    }

    // Success
    toast.success("Scorer created successfully! They are now active.");
    fetchScorersAndAssignments();

    // Reset form and dialog state
    setNewScorer({ name: "", email: "", contact: "", password: "" });
    setShowCreateDialog(false);
  };

  const handleDeleteScorer = async () => {
    if (!scorerToDelete) return;

    // Call the 'delete-user' Edge Function
    const { data: edgeFunctionData, error: edgeFunctionError } =
      await supabase.functions.invoke("delete-user", {
        body: {
          user_id: scorerToDelete.id,
        },
      });

    if (edgeFunctionError) {
      toast.error(
        `Error calling delete function: ${edgeFunctionError.message}`
      );
      return;
    }

    if (edgeFunctionData.error) {
      toast.error(`Failed to delete scorer: ${edgeFunctionData.error}`);
      return;
    }

    toast.success(`Scorer ${scorerToDelete.name} deleted successfully.`);

    // Reset state and refresh the list
    setScorerToDelete(null);
    setShowDeleteConfirm(false);
    fetchScorersAndAssignments(); // Refresh list to reflect changes
  };

  const handleAssignScorer = async () => {
    if (!selectedTournament || !selectedMatch || !selectedScorer) {
      toast.error("Please select a tournament, match, and scorer.");
      return;
    }

    const { error } = await supabase
      .from("matches")
      .update({ scorer_id: selectedScorer })
      .eq("id", selectedMatch);

    if (error) {
      toast.error(`Failed to assign scorer: ${error.message}`);
    } else {
      toast.success("Scorer assigned successfully!");
      fetchScorersAndAssignments();
    }

    setSelectedTournament("");
    setSelectedMatch("");
    setSelectedScorer("");
  };

  const handleRemoveAssignment = async (matchId: string) => {
    const { error } = await supabase
      .from("matches")
      .update({ scorer_id: null })
      .eq("id", matchId);
    if (error) {
      toast.error(`Failed to remove assignment: ${error.message}`);
    } else {
      toast.success("Assignment removed.");
      fetchScorersAndAssignments();
    }
  };

  const filteredMatches = matches.filter(
    (m) => m.tournament_id === selectedTournament
  );

  return (
    <>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
            <Users className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-white mb-1">Scorer Management</h2>
            <p className="text-blue-100">
              Manage scorers and assign them to matches
            </p>
          </div>
        </div>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Assign Scorer to Match
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="assignTournament" className="text-gray-700">
                  Tournament *
                </Label>
                <Select
                  value={selectedTournament}
                  onValueChange={setSelectedTournament}
                >
                  <SelectTrigger
                    id="assignTournament"
                    className="border-gray-300 rounded-lg h-11 hover:border-blue-400 transition-colors"
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
                <Label htmlFor="assignMatch" className="text-gray-700">
                  Match *
                </Label>
                <Select
                  value={selectedMatch}
                  onValueChange={setSelectedMatch}
                  disabled={!selectedTournament}
                >
                  <SelectTrigger
                    id="assignMatch"
                    className="border-gray-300 rounded-lg h-11 hover:border-blue-400 transition-colors"
                  >
                    <SelectValue placeholder="Select match" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMatches.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.match_number || `Match ID: ${m.id.substring(0, 4)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="assignScorer" className="text-gray-700">
                    Scorer *
                  </Label>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    size="sm"
                    variant="outline"
                    className="h-8 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New Scorer
                  </Button>
                </div>
                <Select
                  value={selectedScorer}
                  onValueChange={setSelectedScorer}
                >
                  <SelectTrigger
                    id="assignScorer"
                    className="border-gray-300 rounded-lg h-11 hover:border-blue-400 transition-colors"
                  >
                    <SelectValue placeholder="Select scorer" />
                  </SelectTrigger>
                  <SelectContent>
                    {scorers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAssignScorer}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 shadow-md hover:shadow-lg transition-all"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Scorer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              All Scorers ({scorers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scorers.map((scorer) => (
                <div
                  key={scorer.id}
                  className="group relative p-5 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 mb-2 group-hover:text-blue-700 transition-colors truncate">
                        {scorer.name}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{scorer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{scorer.contact_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* DELETE BUTTON: Removed opacity-0/group-hover for constant visibility */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 h-10 right-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      setScorerToDelete(scorer);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle>Current Assignments ({assignments.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Tournament</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Scorer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-500 py-12"
                      >
                        No assignments yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((assignment) => (
                      <TableRow
                        key={assignment.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{assignment.tournamentName}</TableCell>
                        <TableCell>{assignment.matchNumber}</TableCell>
                        <TableCell className="font-medium">
                          {assignment.scorerName}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {assignment.dateTime}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-600">Assigned</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveAssignment(assignment.id)
                            }
                            className="hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                Add New Scorer
              </DialogTitle>
              <DialogDescription>
                Enter the details for the new scorer.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateScorer} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="newScorerName" className="text-gray-700">
                  Scorer Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="newScorerName"
                    value={newScorer.name}
                    onChange={(e) =>
                      setNewScorer({ ...newScorer, name: e.target.value })
                    }
                    placeholder="Enter scorer name"
                    className="pl-10 border-gray-300 rounded-lg h-11 hover:border-blue-400 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newScorerEmail" className="text-gray-700">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="newScorerEmail"
                    type="email"
                    value={newScorer.email}
                    onChange={(e) =>
                      setNewScorer({ ...newScorer, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className="pl-10 border-gray-300 rounded-lg h-11 hover:border-blue-400 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newScorerContact" className="text-gray-700">
                  Contact Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="newScorerContact"
                    type="tel"
                    value={newScorer.contact}
                    onChange={(e) =>
                      setNewScorer({ ...newScorer, contact: e.target.value })
                    }
                    placeholder="Enter contact number"
                    className="pl-10 border-gray-300 rounded-lg h-11 hover:border-blue-400 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newScorerPassword" className="text-gray-700">
                  Initial Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="newScorerPassword"
                    type="password"
                    value={newScorer.password}
                    onChange={(e) =>
                      setNewScorer({ ...newScorer, password: e.target.value })
                    }
                    placeholder="Set an initial password"
                    className="pl-10 border-gray-300 rounded-lg h-11 hover:border-blue-400 transition-colors"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setNewScorer({
                      name: "",
                      email: "",
                      contact: "",
                      password: "",
                    });
                  }}
                  className="hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Scorer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* AlertDialog for Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to delete the scorer "
              <span className="font-semibold text-gray-800">
                {scorerToDelete?.name}
              </span>
              "?
              <br />
              This action will permanently delete the user account and **remove
              all their match assignments.**
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setScorerToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteScorer}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Delete Scorer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
