import { useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Card, CardContent, CardHeader } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import {
  User,
  Lock,
  AlertCircle,
  SquareFunction,
  Eye,
  EyeOff,
  ArrowLeft, // Added ArrowLeft for the new button
} from "lucide-react";
import { AdminLayout } from "./components/AdminLayout";
import { ScorerLayout } from "./components/ScorerLayout";
import { ViewerLayout } from "./components/ViewerLayout";
import { Toaster } from "./components/ui/sonner";
import { AdminHome } from "./components/admin/AdminHome";
import { MatchesPageEnhanced } from "./components/admin/MatchesPageEnhanced";
import { TournamentsPage } from "./components/admin/TournamentsPage";
import { TournamentDetailsPage } from "./components/admin/TournamentDetailsPage";
import { TeamsPage } from "./components/admin/TeamsPage";
import { CreateTournamentPage } from "./components/admin/CreateTournamentPage";
import { EditTeamPage } from "./components/admin/EditTeamPage";
import { CreateMatchPage } from "./components/admin/CreateMatchPage";
import { EditMatchPage } from "./components/admin/EditMatchPage";
import { AddTeamPage } from "./components/admin/AddTeamPage";
import { ScorerManagementPage } from "./components/admin/ScorerManagementPage";
import { ResultsPage } from "./components/admin/ResultsPage";
import { MatchResultView } from "./components/admin/MatchResultView";
import { ScorerHomeEnhanced } from "./components/scorer/ScorerHomeEnhanced";
import { LiveScoringV4 } from "./components/scorer/LiveScoringV4";
import {
  MatchSetupEnhanced,
  MatchSetupData,
} from "./components/scorer/MatchSetupEnhanced";
import { TurnByTurnResultView } from "./components/TurnByTurnResultView";

// --- Viewer Imports ---
import { TournamentListPage } from "./components/viewer/TournamentListPage";
import { TournamentDetailsPage as ViewerTournamentDetailsPage } from "./components/viewer/TournamentDetailsPage";
import { LiveMatchPage } from "./components/viewer/LiveMatchPage";
import { TeamPage } from "./components/viewer/TeamPage";

// --- Super Admin Imports ---
import { SuperAdminLayout } from "./components/SuperAdminLayout";
import { SuperAdminDashboard } from "./components/super-admin/SuperAdminDashboard";
import { AdminManagement } from "./components/super-admin/AdminManagement";
import { SubscriptionPlans } from "./components/super-admin/SubscriptionPlans";
import { PlatformSettings } from "./components/super-admin/PlatformSettings";
import { ActivityLogs } from "./components/super-admin/ActivityLogs";
import { Analytics } from "./components/super-admin/Analytics";
import { Security } from "./components/super-admin/Security";

// --- Landing Page Import ---
import { LandingPage } from "./components/landing/LandingPage";


import { mockMatches, mockTournaments, mockTeams } from "./utils/mockData";
import {
  User as UserType,
  Match,
  Tournament,
  ScoringAction,
  Team,
  LiveMatch,
} from "./types";
import { supabase } from "./supabaseClient";
import { toast } from "sonner";

// ==========================================
// 1. HELPER WRAPPERS (Admin & Scorer)
// ==========================================

function TournamentEditorWrapper() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const onNavigate = (path: string) => navigate(path);

  return (
    <CreateTournamentPage
      tournamentId={tournamentId}
      onBack={() => onNavigate("/admin/tournaments")}
      onSuccess={() => onNavigate("/admin/tournaments")}
    />
  );
}

function MatchEditorWrapper() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const onNavigate = (path: string) => navigate(path);
  if (!matchId) return <Navigate to="/admin/matches" replace />;

  return (
    <EditMatchPage
      matchId={matchId}
      onBack={() => onNavigate("/admin/matches")}
      onSuccess={() => onNavigate("/admin/matches")}
    />
  );
}

function TeamEditorWrapper() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const onNavigate = (path: string) => navigate(path);
  if (!teamId) return <Navigate to="/admin/teams" replace />;

  return (
    <EditTeamPage
      teamId={teamId}
      onBack={() => onNavigate("/admin/teams")}
      onSuccess={() => onNavigate("/admin/teams")}
    />
  );
}

function MatchResultWrapper() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!matchId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          team_a:teams!team_a_id(*, players!team_id(*)),
          team_b:teams!team_b_id(*, players!team_id(*)),
          tournament:tournaments(*),
          scorer:profiles(name)
        `
        )
        .eq("id", matchId)
        .single();

      if (error) {
        toast.error("Failed to fetch match details.");
        setLoading(false);
        return;
      }

      if (data) {
        const formattedMatch: Match = {
          id: data.id,
          matchNumber: data.match_number,
          tournamentId: data.tournament.id,
          tournamentName: data.tournament.name,
          teamA: {
            id: data.team_a.id,
            name: data.team_a.name,
            captain: data.team_a.captain_name,
            players: data.team_a.players.map((p: any) => ({
              ...p,
              jerseyNumber: p.jersey_number,
            })),
          },
          teamB: {
            id: data.team_b.id,
            name: data.team_b.name,
            captain: data.team_b.captain_name,
            players: data.team_b.players.map((p: any) => ({
              ...p,
              jerseyNumber: p.jersey_number,
            })),
          },
          dateTime: data.match_datetime,
          venue: data.venue,
          status: data.status,
          scoreA: data.score_a,
          scoreB: data.score_b,
          scorerName: data.scorer?.name || "Not Assigned",
        };
        setMatch(formattedMatch);
      }
      setLoading(false);
    };

    fetchMatchDetails();
  }, [matchId]);

  if (loading) {
    return <div>Loading match details...</div>;
  }

  if (!match) {
    return <Navigate to="/admin/results" replace />;
  }

  return (
    <MatchResultView match={match} onBack={() => navigate("/admin/results")} />
  );
}

function MatchSetupWrapper({
  match,
  onBack,
  onStartMatch,
}: {
  match: Match | null;
  onBack: () => void;
  // FIX: Update signature to accept matchId
  onStartMatch: (setupData: MatchSetupData, matchId: string) => void;
}) {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const matchData = useMemo(() => {
    return match || mockMatches.find((m) => m.id === matchId);
  }, [match, matchId]);

  if (!matchData) {
    toast.error("Match data is missing. Redirecting...");
    navigate("/scorer/home", { replace: true });
    return null;
  }

  return (
    <MatchSetupEnhanced
      match={matchData}
      onBack={onBack}
      // FIX: Pass the ID explicitly so the handler knows what to update
      onStartMatch={(data) => onStartMatch(data, matchData.id)}
    />
  );
}

function LiveScoringWrapper({
  match,
  setupData,
  onEndMatch,
  onBack,
}: {
  match: Match | null;
  setupData: MatchSetupData | null;
  onEndMatch: (actions: ScoringAction[]) => void;
  onBack: () => void;
}) {
  const navigate = useNavigate();

  if (!match || !setupData) {
    toast.error("Match setup incomplete. Redirecting...");
    navigate("/scorer/home", { replace: true });
    return null;
  }

  return (
    <LiveScoringV4
      match={match}
      setupData={setupData}
      onBack={onBack}
      onEndMatch={onEndMatch}
    />
  );
}

// ==========================================
// 2. VIEWER WRAPPERS
// ==========================================

function ViewerHomeWrapper() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: false });

      if (data) {
        const formatted: Tournament[] = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          startDate: t.start_date,
          endDate: t.end_date,
          location: t.location,
          type: t.type || "Standard",
          status: t.status,
        }));
        setTournaments(formatted);
      }
      setLoading(false);
    };
    fetchTournaments();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <TournamentListPage
      tournaments={tournaments}
      onViewTournament={(id) => navigate(`/viewer/tournament/${id}`)}
    />
  );
}

function ViewerTournamentDetailsWrapper() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!tournamentId) return;

      const { data: tData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (tData) {
        setTournament({
          id: tData.id,
          name: tData.name,
          startDate: tData.start_date,
          endDate: tData.end_date,
          location: tData.location,
          type: tData.type,
          status: tData.status,
        });
      }

      const { data: mData, error: mError } = await supabase
        .from("matches")
        .select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`)
        .eq("tournament_id", tournamentId)
        .order("match_datetime", { ascending: true });

      if (mData) {
        const formattedMatches: Match[] = mData.map((m: any) => ({
          id: m.id,
          matchNumber: m.match_number,
          tournamentId: m.tournament_id,
          tournamentName: tData?.name || "",
          teamA: {
            id: m.team_a?.id,
            name: m.team_a?.name,
            logo: m.team_a?.logo_url || m.team_a?.logo,
            players: [],
            captain: "",
          },
          teamB: {
            id: m.team_b?.id,
            name: m.team_b?.name,
            logo: m.team_b?.logo_url || m.team_b?.logo,
            players: [],
            captain: "",
          },
          dateTime: m.match_datetime,
          venue: m.venue,
          status: m.status,
          scoreA: m.score_a,
          scoreB: m.score_b,
        }));
        setMatches(formattedMatches);
      }

      const { data: teamData } = await supabase.from("teams").select("*");
      if (teamData) {
        setTeams(
          teamData.map((t: any) => ({
            id: t.id,
            name: t.name,
            captain: t.captain_name,
            players: [],
          }))
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [tournamentId]);

  if (loading) return <div>Loading details...</div>;
  if (!tournament) return <Navigate to="/viewer/home" replace />;

  return (
    <ViewerTournamentDetailsPage
      tournament={tournament}
      matches={matches}
      teams={teams}
      onBack={() => navigate("/viewer/home")}
      onViewMatch={(id) => navigate(`/viewer/match/${id}`)}
      onViewTeam={(id) => navigate(`/viewer/team/${id}`)}
      onViewStandings={() => {}}
    />
  );
}

function ViewerLiveMatchWrapper() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`)
        .eq("id", matchId)
        .single();

      if (data) {
        const { data: actionsData } = await supabase
          .from("scoring_actions")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true });

        const actions = actionsData
          ? actionsData.map((a: any) => ({
              ...a,
              matchId: a.match_id,
              attackerName: a.attacker_name,
              defenderName: a.defender_name,
              attackerJersey: a.attacker_jersey,
              defenderJersey: a.defender_jersey,
              scoringTeamId: a.scoring_team_id,
              timestamp: a.created_at,
              team: a.scoring_team_id === data.team_a_id ? "A" : "B",
            }))
          : [];

        const liveScoreA = actions
          .filter((a: any) => a.scoringTeamId === data.team_a_id)
          .reduce((sum: number, a: any) => sum + (a.points || 0), 0);

        const liveScoreB = actions
          .filter((a: any) => a.scoringTeamId === data.team_b_id)
          .reduce((sum: number, a: any) => sum + (a.points || 0), 0);

        const liveMatch: LiveMatch = {
          id: data.id,
          matchNumber: data.match_number,
          tournamentId: data.tournament_id,
          tournamentName: "Kho Kho Tournament",
          teamA: {
            id: data.team_a?.id,
            name: data.team_a?.name,
            captain: data.team_a?.captain_name,
            players: [],
            logo: data.team_a?.logo_url || data.team_a?.logo,
          },
          teamB: {
            id: data.team_b?.id,
            name: data.team_b?.name,
            captain: data.team_b?.captain_name,
            players: [],
            logo: data.team_b?.logo_url || data.team_b?.logo,
          },
          dateTime: data.match_datetime,
          venue: data.venue,
          status: data.status,
          scoreA: liveScoreA,
          scoreB: liveScoreB,
          currentInning: data.current_inning || 1,
          currentTurn: data.current_turn || 1,
          attackingTeam: "A",
          turnStartTime: data.turn_start_time || data.match_datetime,
          turnTimeRemaining: 0,
          actions: actions,
        };
        setMatch(liveMatch);
      }
      setLoading(false);
    };

    fetchMatch();

    const subscription = supabase
      .channel(`match-viewer-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scoring_actions",
          filter: `match_id=eq.${matchId}`,
        },
        () => fetchMatch()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        () => fetchMatch()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [matchId]);

  if (loading) return <div>Loading match...</div>;
  if (!match) return <div>Match not found</div>;

  return (
    <LiveMatchPage
      match={match}
      onBack={() => navigate(`/viewer/tournament/${match.tournamentId}`)}
    />
  );
}

function ViewerTeamWrapper() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;
      const { data: tData } = await supabase
        .from("teams")
        .select(`*, players(*)`)
        .eq("id", teamId)
        .single();

      if (tData) {
        setTeam({
          id: tData.id,
          name: tData.name,
          captain: tData.captain_name,
          coach: tData.coach_name,
          logo: tData.logo_url,
          players: tData.players.map((p: any) => ({
            ...p,
            jerseyNumber: p.jersey_number,
            isActive: p.is_active,
            isCaptain: p.is_captain,
          })),
        });
      }

      const { data: mData } = await supabase
        .from("matches")
        .select(
          `*, team_a:teams!team_a_id(id,name), team_b:teams!team_b_id(id,name)`
        )
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
        .order("match_datetime", { ascending: false });

      if (mData) {
        const formattedMatches: Match[] = mData.map((m: any) => ({
          id: m.id,
          matchNumber: m.match_number,
          tournamentId: m.tournament_id,
          tournamentName: "",
          teamA: {
            id: m.team_a.id,
            name: m.team_a.name,
            captain: "",
            players: [],
          },
          teamB: {
            id: m.team_b.id,
            name: m.team_b.name,
            captain: "",
            players: [],
          },
          dateTime: m.match_datetime,
          venue: m.venue,
          status: m.status,
          scoreA: m.score_a,
          scoreB: m.score_b,
        }));
        setMatches(formattedMatches);
      }
      setLoading(false);
    };
    fetchTeamData();
  }, [teamId]);

  if (loading) return <div>Loading team...</div>;
  if (!team) return <Navigate to="/viewer/home" replace />;

  return <TeamPage team={team} matches={matches} onBack={() => navigate(-1)} />;
}

function ViewerRouter({
  currentUser,
  onLogout,
}: {
  currentUser: UserType;
  onLogout: () => void;
}) {
  return (
    <ViewerLayout onLogout={onLogout} userName={currentUser.name}>
      <Routes>
        <Route path="home" element={<ViewerHomeWrapper />} />
        <Route
          path="tournament/:tournamentId"
          element={<ViewerTournamentDetailsWrapper />}
        />
        <Route path="match/:matchId" element={<ViewerLiveMatchWrapper />} />
        <Route path="team/:teamId" element={<ViewerTeamWrapper />} />
        <Route path="/" element={<Navigate to="home" replace />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </ViewerLayout>
  );
}

// ==========================================
// 3. SCORER ROUTER (FIXED STATUS LOGIC)
// ==========================================

function ScorerRouter({
  currentUser,
  onLogout,
  selectedMatch,
  setSelectedMatch,
  matchSetupData,
  setMatchSetupData,
}: {
  currentUser: UserType;
  onLogout: () => void;
  selectedMatch: Match | null;
  setSelectedMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  matchSetupData: MatchSetupData | null;
  setMatchSetupData: React.Dispatch<
    React.SetStateAction<MatchSetupData | null>
  >;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const onBackToHome = () => navigate("/scorer/home");
  const onBackFromScoring = () => {
    setSelectedMatch(null);
    setMatchSetupData(null);
    navigate("/scorer/home");
  };

  // --- UPDATED HANDLE START MATCH ---
  const handleStartMatch = (match: Match) => {
    setSelectedMatch(match);

    if (match.status === "live") {
      // If match is already live, bypass setup and resume scoring
      // We construct a basic setupData object; LiveScoringV4 will
      // hydrate the actual game state (innings, batches, etc.) from localStorage.
      const resumeSetupData: MatchSetupData = {
        teamAPlaying: match.teamA.players,
        teamASubstitutes: [],
        teamBPlaying: match.teamB.players,
        teamBSubstitutes: [],
        tossWinner: (match.tossWinner as "A" | "B") || "A",
        tossDecision: (match.tossDecision as "attack" | "defend") || "attack",
        playersPerTeam: match.playersPerTeam || 9,
        timerDuration: match.turnDuration || 540,
      };
      setMatchSetupData(resumeSetupData);
      navigate(`/scorer/match/${match.id}/live`);
    } else {
      // For upcoming matches, go to setup
      navigate(`/scorer/match/${match.id}/setup`);
    }
  };

  // FIX: Accept matchId explicitly to handle state loss or refresh
  const handleMatchSetupComplete = async (
    setupData: MatchSetupData,
    matchId?: string
  ) => {
    setMatchSetupData(setupData);

    // Use the explicitly passed matchId OR fall back to state
    const targetMatchId = matchId || selectedMatch?.id;

    if (targetMatchId) {
      const { error } = await supabase
        .from("matches")
        .update({
          status: "live",
          toss_winner: setupData.tossWinner,
          toss_decision: setupData.tossDecision,
          turn_start_time: new Date().toISOString(), // Fix Timer Sync
        })
        .eq("id", targetMatchId);

      if (error) {
        toast.error("Failed to start match: " + error.message);
        console.error(error);
      } else {
        toast.success("Match is now LIVE!");
        // Update state if available
        if (selectedMatch) {
          selectedMatch.status = "live";
        }
      }
      navigate(`/scorer/match/${targetMatchId}/live`);
    } else {
      toast.error("Error: Match ID not found.");
    }
  };

  const handleEndMatch = async (actions: ScoringAction[]) => {
    if (!selectedMatch) return;
    let scoreA = 0;
    let scoreB = 0;
    actions.forEach((action) => {
      const scoringId = (action as any).scoring_team_id || action.scoringTeamId;
      if (scoringId === selectedMatch.teamA.id) scoreA += action.points;
      else if (scoringId === selectedMatch.teamB.id) scoreB += action.points;
    });

    const { error } = await supabase
      .from("matches")
      .update({ status: "finished", score_a: scoreA, score_b: scoreB })
      .eq("id", selectedMatch.id);

    if (error) {
      toast.error(`Failed: ${error.message}`);
    } else {
      toast.success("Match ended.");
      onBackFromScoring();
    }
  };

  return (
    <ScorerLayout
      onLogout={onLogout}
      userName={currentUser.name}
      showHeader={!location.pathname.includes("/live")}
      onBack={location.pathname.includes("/setup") ? onBackToHome : undefined}
    >
      <Routes>
        <Route
          path="home"
          element={
            <ScorerHomeEnhanced
              user={currentUser}
              onStartMatch={handleStartMatch}
            />
          }
        />
        <Route
          path="match/:matchId/setup"
          element={
            <MatchSetupWrapper
              match={selectedMatch}
              onBack={onBackToHome}
              onStartMatch={handleMatchSetupComplete}
            />
          }
        />
        <Route
          path="match/:matchId/live"
          element={
            <LiveScoringWrapper
              match={selectedMatch}
              setupData={matchSetupData}
              onEndMatch={handleEndMatch}
              onBack={onBackFromScoring}
            />
          }
        />
        <Route
          path="results/match/:matchId"
          element={<TurnByTurnResultView />}
        />
        <Route path="/" element={<Navigate to="home" replace />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </ScorerLayout>
  );
}

// ==========================================
// 4. SUPER ADMIN ROUTER
// ==========================================

function SuperAdminRouter({
  currentUser,
  onLogout,
}: {
  currentUser: UserType;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const onNavigate = (path: string) => navigate(path);
  // Extract path segment after /superadmin/ for sidebar highlight
  const currentPage = location.pathname.split("/superadmin/")[1] || "super-dashboard";
  
  return (
    <SuperAdminLayout
      currentPage={currentPage}
      onNavigate={(pageId) => onNavigate(`/superadmin/${pageId}`)}
      onLogout={onLogout}
    >
      <Routes>
        <Route path="super-dashboard" element={<SuperAdminDashboard />} />
        <Route path="super-admins" element={<AdminManagement />} />
        <Route path="super-plans" element={<SubscriptionPlans />} />
        <Route path="super-settings" element={<PlatformSettings />} />
        <Route path="super-logs" element={<ActivityLogs />} />
        <Route path="super-analytics" element={<Analytics />} />
        <Route path="super-security" element={<Security />} />
        <Route path="/" element={<Navigate to="super-dashboard" replace />} />
        <Route path="*" element={<Navigate to="super-dashboard" replace />} />
      </Routes>
    </SuperAdminLayout>
  );
}

// ==========================================
// 5. MAIN APP & AUTH
// ==========================================

function AdminRouter({
  currentUser,
  onLogout,
}: {
  currentUser: UserType;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const onNavigate = (path: string) => navigate(path);
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinishedMatches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("matches")
        .select(
          `*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*), tournament:tournaments(*), scorer:profiles(name)`
        )
        .eq("status", "finished")
        .order("match_datetime", { ascending: false });

      if (data) {
        setFinishedMatches(
          data.map((m: any) => ({
            id: m.id,
            matchNumber: m.match_number,
            tournamentId: m.tournament.id,
            tournamentName: m.tournament.name,
            teamA: {
              id: m.team_a.id,
              name: m.team_a.name,
              captain: m.team_a.captain_name,
              players: [],
            },
            teamB: {
              id: m.team_b.id,
              name: m.team_b.name,
              captain: m.team_b.captain_name,
              players: [],
            },
            dateTime: m.match_datetime,
            venue: m.venue,
            status: m.status,
            scoreA: m.score_a,
            scoreB: m.score_b,
            scorerName: m.scorer?.name || "Not Assigned",
          }))
        );
      }
      setLoading(false);
    };
    fetchFinishedMatches();
  }, []);

  return (
    <AdminLayout
      currentPage={location.pathname.split("/admin/")[1] || "home"}
      onNavigate={onNavigate}
      onLogout={onLogout}
      userName={currentUser.name}
    >
      <Routes>
        <Route path="home" element={<AdminHome />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route
          path="tournaments/create"
          element={<TournamentEditorWrapper />}
        />
        <Route
          path="tournaments/edit/:tournamentId"
          element={<TournamentEditorWrapper />}
        />
        <Route path="matches" element={<MatchesPageEnhanced />} />
        <Route
          path="matches/create"
          element={
            <CreateMatchPage onBack={() => onNavigate("/admin/matches")} />
          }
        />
        <Route path="matches/edit/:matchId" element={<MatchEditorWrapper />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/add" element={<AddTeamPage />} />
        <Route path="teams/edit/:teamId" element={<TeamEditorWrapper />} />
        <Route path="scorers" element={<ScorerManagementPage />} />
        <Route
          path="results"
          element={
            loading ? (
              <div>Loading...</div>
            ) : (
              <ResultsPage
                matches={finishedMatches}
                onViewResult={(id) => onNavigate(`/admin/results/match/${id}`)}
              />
            )
          }
        />
        <Route
          path="results/match/:matchId"
          element={<TurnByTurnResultView />}
        />
        <Route path="/" element={<Navigate to="home" replace />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchSetupData, setMatchSetupData] = useState<MatchSetupData | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) await fetchAndSetUserProfile(session.user);
      setSessionChecked(true);
    };
    checkSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchAndSetUserProfile(session.user);
      else {
        setCurrentUser(null);
        navigate("/", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchAndSetUserProfile = async (authUser: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", authUser.id)
      .single();
    if (profile) {
      const user: UserType = {
        id: authUser.id,
        name: profile.name || authUser.email,
        email: authUser.email,
        role: profile.role,
      };
      setCurrentUser(user);
      
      const role = profile.role;
      const targetPath = `/${role}/home`.replace("/superadmin/home", "/superadmin/super-dashboard");

      if (role === "admin" || role === "scorer" || role === "viewer" || role === "superadmin") {
        if (!window.location.pathname.startsWith(targetPath.replace("/home", "").replace("/super-dashboard", ""))) {
           navigate(targetPath, { replace: true });
        }
      } 
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else if (data.user) await fetchAndSetUserProfile(data.user);
  };

  const handleLogout = async () => await supabase.auth.signOut();
  
  // --- Landing Page Actions ---
  const handleStartLogin = () => navigate("/login");
  const handleViewViewer = () => navigate("/viewer/home");
  const handleGoHome = () => navigate("/");


  if (!sessionChecked)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* New: Root path / leads to LandingPage or redirects if logged in */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate 
                to={`/${currentUser.role}/home`.replace("/superadmin/home", "/superadmin/super-dashboard")} 
                replace 
              />
            ) : (
              <LandingPage
                onGetStarted={handleStartLogin}
                onViewDemo={handleViewViewer}
              />
            )
          }
        />
        {/* New Login page route */}
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate 
                to={`/${currentUser.role}/home`.replace("/superadmin/home", "/superadmin/super-dashboard")} 
                replace 
              />
            ) : (
              <LoginPage
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                handleLogin={handleLogin}
                onGoHome={handleGoHome} // Pass new prop
              />
            )
          }
        />
        {/* NEW: SuperAdmin Route */}
        {currentUser?.role === "superadmin" && (
          <Route
            path="/superadmin/*"
            element={
              <SuperAdminRouter
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            }
          />
        )}
        {currentUser?.role === "admin" && (
          <Route
            path="/admin/*"
            element={
              <AdminRouter currentUser={currentUser} onLogout={handleLogout} />
            }
          />
        )}
        {currentUser?.role === "scorer" && (
          <Route
            path="/scorer/*"
            element={
              <ScorerRouter
                currentUser={currentUser}
                onLogout={handleLogout}
                selectedMatch={selectedMatch}
                setSelectedMatch={setSelectedMatch}
                matchSetupData={matchSetupData}
                setMatchSetupData={setMatchSetupData}
              />
            }
          />
        )}
        {currentUser?.role === "viewer" && (
          <Route
            path="/viewer/*"
            element={
              <ViewerRouter currentUser={currentUser} onLogout={handleLogout} />
            }
          />
        )}
        {/* Fallback route - directs back to home/landing or role dashboard */}
        <Route
          path="*"
          element={
            <Navigate
              to={currentUser ? `/${currentUser.role}/home`.replace("/superadmin/home", "/superadmin/super-dashboard") : "/"}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

function LoginPage({
  email,
  setEmail,
  password,
  setPassword,
  error,
  handleLogin,
  onGoHome, // <-- New Prop
}: {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string | null;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  onGoHome: () => void; // <-- New Prop Type
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        <div className="mb-8 flex items-center justify-center">
          <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <SquareFunction className="w-12 h-12" />
          </div>
        </div>
        <Card className="w-full max-w-md shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <h1 className="text-gray-900 mb-2">Login</h1>
            <p className="text-gray-600">
              Enter your credentials to access the system
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-white border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-gray-700"
                    onClick={togglePasswordVisibility}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                >
                  Sign In
                </Button>
                {/* NEW: Back to Home Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onGoHome}
                  className="w-full h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
