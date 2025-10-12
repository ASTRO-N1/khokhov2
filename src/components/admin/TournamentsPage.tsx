import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { Tournament, Match, Team } from "../../types";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
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
import { useNavigate } from "react-router-dom";
import { TournamentDetailsPage } from "./TournamentDetailsPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface DbTournament extends Tournament {
  level?: string;
}

export function TournamentsPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<DbTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tournamentToDelete, setTournamentToDelete] =
    useState<DbTournament | null>(null);
  const [selectedTournament, setSelectedTournament] =
    useState<DbTournament | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(`Error fetching tournaments: ${error.message}`);
    } else if (data) {
      const formattedData = data.map((t) => ({
        id: t.id,
        name: t.name,
        startDate: t.start_date,
        endDate: t.end_date,
        location: t.venue,
        type: t.tournament_type,
        status: t.status,
        level: t.level,
      }));
      setTournaments(formattedData as DbTournament[]);
    }
    setLoading(false);
  };

  const handleDeleteTournament = async () => {
    if (!tournamentToDelete) return;

    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournamentToDelete.id);

    if (error) {
      toast.error(`Error deleting tournament: ${error.message}`);
    } else {
      toast.success(
        `Tournament "${tournamentToDelete.name}" deleted successfully.`
      );
      fetchTournaments();
    }
    setTournamentToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ongoing":
        return <Badge className="bg-green-600">Ongoing</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-600">Upcoming</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredTournaments = tournaments.filter(
    (tournament) =>
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tournament.location &&
        tournament.location
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (tournament.type &&
        tournament.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (tournamentId: string) =>
    navigate(`/admin/tournaments/edit/${tournamentId}`);
  const handleViewDetails = (tournament: DbTournament) =>
    setSelectedTournament(tournament);
  const handleCreate = () => navigate("/admin/tournaments/create");

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
          <Trophy className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-white mb-1">Tournament Management</h2>
            <p className="text-blue-100">Create and manage tournaments</p>
          </div>
          <Button
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-md"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search tournaments by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 rounded-lg h-11"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p>Loading tournaments...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="hover:shadow-xl transition-all border-gray-200 group overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {tournament.name}
                    </h3>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => handleEdit(tournament.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setTournamentToDelete(tournament)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                      {new Date(tournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{tournament.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tournament.level && (
                      <Badge
                        variant="outline"
                        className="border-blue-300 text-blue-700"
                      >
                        {tournament.level}
                      </Badge>
                    )}
                    {tournament.type && (
                      <Badge variant="outline">{tournament.type}</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all"
                    onClick={() => handleViewDetails(tournament)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!tournamentToDelete}
        onOpenChange={() => setTournamentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Are you sure you want to delete this tournament?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete the tournament:{" "}
              <span className="font-semibold text-gray-800">
                "{tournamentToDelete?.name}"
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTournament}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!selectedTournament}
        onOpenChange={() => setSelectedTournament(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTournament && (
            <TournamentDetailsPage
              tournament={selectedTournament}
              onBack={() => setSelectedTournament(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
