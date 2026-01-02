import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Plus,
  Search,
  Edit,
  Users,
  Crown,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Team } from "../../types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface EnrichedTeam extends Team {
  tournamentName: string;
}

export function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<EnrichedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    setLoading(true);

    // 1. Get Current User
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Fetch MY Teams only
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*, tournament:tournaments(name)")
      .eq("user_id", user?.id) // <--- FILTER ADDED
      .order("name");

    if (teamsError) {
      toast.error(`Error fetching teams: ${teamsError.message}`);
      setLoading(false);
      return;
    }

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*");

    if (playersError) {
      toast.error(`Error fetching players: ${playersError.message}`);
      setLoading(false);
      return;
    }

    const combinedData = teamsData.map((team: any) => ({
      id: team.id,
      name: team.name,
      captain: team.captain_name,
      tournamentName: team.tournament?.name || "N/A",
      players: playersData
        .filter((player) => player.team_id === team.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          jerseyNumber: p.jersey_number,
          teamId: team.id,
          role: "playing",
          isActive: true,
        })),
    }));

    setTeams(combinedData as EnrichedTeam[]);
    setLoading(false);
  }

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamToDelete.id);
    if (error) {
      toast.error(`Failed to delete team: ${error.message}`);
    } else {
      toast.success(`Team "${teamToDelete.name}" was successfully deleted.`);
      fetchTeams();
    }
    setTeamToDelete(null);
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.captain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.tournamentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-10">
          <Users className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-white mb-1">Team Management</h2>
            <p className="text-blue-100">Manage teams and players</p>
          </div>
          <Button
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-md"
            onClick={() => navigate("/admin/teams/add")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search teams by name, captain, or tournament..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 rounded-lg h-11"
            />
          </div>
        </CardContent>
      </Card>
      {loading ? (
        <p>Loading teams...</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {filteredTeams.map((team) => (
            <AccordionItem
              key={team.id}
              value={team.id}
              className="border rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              <AccordionTrigger className="px-6 hover:no-underline group">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-gray-900 group-hover:text-blue-600 transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-600" />
                        Captain: {team.captain}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {team.tournamentName}
                      </Badge>
                    </div>
                  </div>
                  <Badge className="bg-blue-600">
                    {team.players.length} Players
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6 pt-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-blue-600 rounded-full" />
                      <h4 className="text-gray-900">
                        Player Squad ({team.players.length})
                      </h4>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {team.players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                            {player.jerseyNumber}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 text-sm">
                              {player.name}
                            </p>
                            {player.name === team.captain && (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <Crown className="w-3 h-3" />
                                <span className="text-xs">Captain</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => navigate(`/admin/teams/edit/${team.id}`)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Team
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setTeamToDelete(team)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Team
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      <AlertDialog
        open={!!teamToDelete}
        onOpenChange={() => setTeamToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the team{" "}
              <span className="font-semibold text-gray-800">
                "{teamToDelete?.name}"
              </span>{" "}
              and all of its players. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
