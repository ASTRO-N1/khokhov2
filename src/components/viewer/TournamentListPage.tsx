import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar, MapPin, Trophy, ChevronRight } from "lucide-react";
import { Tournament } from "../../types";

interface TournamentListPageProps {
  tournaments: Tournament[];
  onViewTournament: (tournamentId: string) => void;
}

export function TournamentListPage({
  tournaments,
  onViewTournament,
}: TournamentListPageProps) {
  const getStatusColor = (status: Tournament["status"]) => {
    switch (status) {
      case "ongoing":
        return "bg-red-100 text-red-700 border-red-200";
      case "upcoming":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: Tournament["status"]) => {
    switch (status) {
      case "ongoing":
        return "LIVE";
      case "upcoming":
        return "UPCOMING";
      case "completed":
        return "FINISHED";
      default:
        return String(status).toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tournaments</h1>
          <p className="text-gray-600">Browse all Kho-Kho tournaments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <Card
            key={tournament.id}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200"
            onClick={() => onViewTournament(tournament.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge
                    className={`${getStatusColor(tournament.status)} border`}
                  >
                    {tournament.status === "ongoing" && (
                      <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-1 animate-pulse" />
                    )}
                    {getStatusLabel(tournament.status)}
                  </Badge>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <CardTitle className="text-gray-900 text-lg">
                {tournament.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {new Date(tournament.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {" - "}
                  {new Date(tournament.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{tournament.location}</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded">
                  {tournament.type}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tournaments.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No tournaments available</p>
            <p className="text-sm text-gray-500">
              Check back later for upcoming tournaments
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
