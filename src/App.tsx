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
import { User, Lock, AlertCircle, SquareFunction } from "lucide-react";
import { AdminLayout } from "./components/AdminLayout";
import { ScorerLayout } from "./components/ScorerLayout";
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
import { mockMatches, mockTournaments, mockTeams } from "./utils/mockData";
import { User as UserType, Match, Tournament, ScoringAction } from "./types";
import { supabase } from "./supabaseClient";
import { toast } from "sonner";

// --- Helper Wrappers for Routing ---

// Renders the CreateTournamentPage (for both create and edit modes)
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

// Renders the EditMatchPage
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

// Renders the EditTeamPage
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

// Renders MatchDetailsPage for a specific match
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
          team_a:teams!matches_team_a_id_fkey(*, players!team_id(*)),
          team_b:teams!matches_team_b_id_fkey(*, players!team_id(*)),
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

// Renders TournamentDetailsPage for a specific tournament
function TournamentDetailsWrapper() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const onNavigate = (path: string) => navigate(path);
  // In a real app, this would fetch the tournament details.
  const tournament = mockTournaments.find(
    (t) => t.id === tournamentId
  ) as unknown as Tournament;

  if (!tournament) return <Navigate to="/admin/tournaments" replace />;

  return (
    <TournamentDetailsPage
      tournament={tournament}
      matches={mockMatches}
      teams={mockTeams}
      onBack={() => onNavigate("/admin/tournaments")}
    />
  );
}

// Renders the MatchSetupEnhanced Page
function MatchSetupWrapper({
  match,
  onBack,
  onStartMatch,
}: {
  match: Match | null;
  onBack: () => void;
  onStartMatch: (setupData: MatchSetupData) => void;
}) {
  const { matchId } = useParams();
  const navigate = useNavigate();

  // If match is not set in state, look it up from mock data using URL param.
  const matchData = useMemo(() => {
    return match || mockMatches.find((m) => m.id === matchId);
  }, [match, matchId]);

  // Guard clause if data is missing or user navigated directly
  if (!matchData) {
    toast.error("Match data is missing. Redirecting...");
    navigate("/scorer/home", { replace: true });
    return null;
  }

  return (
    <MatchSetupEnhanced
      match={matchData}
      onBack={onBack}
      onStartMatch={onStartMatch}
    />
  );
}

// Renders the LiveScoringV4 Page
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

  // Guard clause if setup data is missing (e.g., page refresh on live-scoring)
  if (!match || !setupData) {
    toast.error("Match setup incomplete. Redirecting...");
    // A more robust solution might try to fetch/reconstruct this data
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

function AdminRouter({
  currentUser,
  onLogout,
}: {
  currentUser: UserType;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const onNavigate = (path: string) => navigate(path);
  const location = useLocation();
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinishedMatches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          team_a:teams!matches_team_a_id_fkey(*),
          team_b:teams!matches_team_b_id_fkey(*),
          tournament:tournaments(*),
          scorer:profiles(name)
        `
        )
        .eq("status", "finished")
        .order("match_datetime", { ascending: false });

      if (error) {
        toast.error("Failed to fetch finished matches.");
      } else if (data) {
        const formattedMatches: Match[] = data.map((m: any) => ({
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
        }));
        setFinishedMatches(formattedMatches);
      }
      setLoading(false);
    };

    fetchFinishedMatches();
  }, []);

  return (
    <AdminLayout
      // Use pathname for highlighting the active link in the sidebar
      currentPage={location.pathname.split("/admin/")[1] || "home"}
      onNavigate={onNavigate}
      onLogout={onLogout}
      userName={currentUser.name}
    >
      <Routes>
        <Route path="home" element={<AdminHome matches={mockMatches} />} />

        <Route path="tournaments" element={<TournamentsPage />} />
        <Route
          path="tournaments/create"
          element={<TournamentEditorWrapper />}
        />
        <Route
          path="tournaments/edit/:tournamentId"
          element={<TournamentEditorWrapper />}
        />
        <Route
          path="tournaments/:tournamentId"
          element={<TournamentDetailsWrapper />}
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
              <div>Loading results...</div>
            ) : (
              <ResultsPage
                matches={finishedMatches}
                onViewResult={(id) => onNavigate(`/admin/results/${id}`)}
              />
            )
          }
        />
        <Route path="results/:matchId" element={<MatchResultWrapper />} />

        <Route path="/" element={<Navigate to="home" replace />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </AdminLayout>
  );
}

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

  const handleStartMatch = (match: Match) => {
    setSelectedMatch(match);
    navigate(`/scorer/match/${match.id}/setup`);
  };

  const handleMatchSetupComplete = (setupData: MatchSetupData) => {
    setMatchSetupData(setupData);
    // Use match ID in the URL to retain context on refresh
    navigate(`/scorer/match/${selectedMatch?.id}/live`);
  };

  const handleEndMatch = async (actions: ScoringAction[]) => {
    if (!selectedMatch) return;

    let scoreA = 0;
    let scoreB = 0;

    // FIX: Calculate points based on the scoring team's ID
    actions.forEach((action) => {
      // NOTE: ScoringAction interface has 'scoringTeamId', DbScoringAction has 'scoring_team_id'
      const scoringId = (action as any).scoring_team_id || action.scoringTeamId;

      if (scoringId === selectedMatch.teamA.id) {
        scoreA += action.points;
      } else if (scoringId === selectedMatch.teamB.id) {
        scoreB += action.points;
      }
    });

    const { error } = await supabase
      .from("matches")
      .update({
        status: "finished",
        score_a: scoreA, // Correctly saves the final score A
        score_b: scoreB, // Correctly saves the final score B
      })
      .eq("id", selectedMatch.id);

    if (error) {
      toast.error(`Failed to end match: ${error.message}`);
    } else {
      // Update the local match object scores before redirecting to ensure the UI updates if necessary
      selectedMatch.scoreA = scoreA;
      selectedMatch.scoreB = scoreB;
      selectedMatch.status = "finished";
      toast.success("Match has been successfully ended and results are saved.");
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

        <Route path="/" element={<Navigate to="home" replace />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </ScorerLayout>
  );
}

// --- Main App Component ---
export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // State for passing volatile data between Scorer pages (MatchSetup -> LiveScoring)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchSetupData, setMatchSetupData] = useState<MatchSetupData | null>(
    null
  );

  const navigate = useNavigate();

  useEffect(() => {
    const checkSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAndSetUserProfile(session.user);
      }
      setSessionChecked(true);
    };

    checkSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAndSetUserProfile(session.user);
      } else {
        setCurrentUser(null);
        navigate("/", { replace: true }); // Redirect to login on logout/session end
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAndSetUserProfile = async (authUser: any) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", authUser.id)
      .single();

    if (error) {
      toast.error("Could not fetch user profile.");
      await supabase.auth.signOut();
      return;
    }

    if (profile) {
      const user: UserType = {
        id: authUser.id,
        name: profile.name || authUser.email,
        email: authUser.email as string,
        role: profile.role as "admin" | "scorer",
      };
      setCurrentUser(user);

      // Redirect based on role only if we're not already on a page for that role
      if (
        profile.role === "admin" &&
        !window.location.pathname.startsWith("/admin")
      ) {
        navigate("/admin/home", { replace: true });
      } else if (
        profile.role === "scorer" &&
        !window.location.pathname.startsWith("/scorer")
      ) {
        navigate("/scorer/home", { replace: true });
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) {
      await fetchAndSetUserProfile(data.user);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // --- Main Routing ---
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Login/Unauthenticated Route */}
        <Route
          path="/"
          element={
            !currentUser ? (
              <LoginPage
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                handleLogin={handleLogin}
              />
            ) : (
              <Navigate to={`/${currentUser.role}/home`} replace />
            )
          }
        />

        {/* Authenticated Admin Routes */}
        {currentUser?.role === "admin" && (
          <Route
            path="/admin/*"
            element={
              <AdminRouter currentUser={currentUser} onLogout={handleLogout} />
            }
          />
        )}

        {/* Authenticated Scorer Routes */}
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

        {/* Fallback Routes */}
        <Route
          path="*"
          element={
            <Navigate
              to={currentUser ? `/${currentUser.role}/home` : "/"}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

// --- Extracted Login Page Component ---
function LoginPage({
  email,
  setEmail,
  password,
  setPassword,
  error,
  handleLogin,
}: {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string | null;
  handleLogin: (e: React.FormEvent) => Promise<void>;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full border-4 border-blue-600"></div>
        <div className="absolute top-40 right-32 w-24 h-24 rounded-full border-4 border-blue-600"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full border-4 border-blue-600"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 rounded-full border-4 border-blue-600"></div>
      </div>
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
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
