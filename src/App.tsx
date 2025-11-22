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
} from "lucide-react";
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
import { TurnByTurnResultView } from "./components/TurnByTurnResultView";

// --- Helper Wrappers ---

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
          `*, team_a:teams!matches_team_a_id_fkey(*, players!team_id(*)), team_b:teams!matches_team_b_id_fkey(*, players!team_id(*)), tournament:tournaments(*), scorer:profiles(name)`
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

  if (loading) return <div>Loading match details...</div>;
  if (!match) return <Navigate to="/admin/results" replace />;
  return (
    <MatchResultView match={match} onBack={() => navigate("/admin/results")} />
  );
}

function TournamentDetailsWrapper() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const onNavigate = (path: string) => navigate(path);
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
      onStartMatch={onStartMatch}
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
  const { matchId } = useParams();

  // --- NEW: Auto-Recover Setup Data from Storage ---
  const [localSetup, setLocalSetup] = useState<MatchSetupData | null>(null);

  useEffect(() => {
    // If props are missing (refresh), try local storage
    if (!setupData && matchId) {
      const stored = localStorage.getItem(`match_setup_${matchId}`);
      if (stored) {
        try {
          setLocalSetup(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse saved match setup");
        }
      }
    }
  }, [setupData, matchId]);

  const effectiveSetup = setupData || localSetup;

  // If still missing after check, then redirect
  if (!match || !effectiveSetup) {
    // Only redirect if we've tried to load and failed
    if (!setupData && !localSetup && matchId) {
      // Give it a split second for useEffect to fire? No, useEffect runs after render.
      // If localSetup is null on first render, we might flicker or redirect.
      // Better strategy: Return null until we check.
      const stored = localStorage.getItem(`match_setup_${matchId}`);
      if (!stored) {
        // Genuine missing data
        toast.error("Match setup missing. Please restart match.");
        navigate("/scorer/home", { replace: true });
        return null;
      }
      // If stored exists, we wait for the useEffect to set it.
      // Or we can lazily initialize state.
    }
    // If we have storage but state isn't set yet
    if (!effectiveSetup) return null;
  }

  return (
    <LiveScoringV4
      match={match}
      setupData={effectiveSetup!}
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
          `*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*), tournament:tournaments(*), scorer:profiles(name)`
        )
        .eq("status", "finished")
        .order("match_datetime", { ascending: false });

      if (error) toast.error("Failed to fetch finished matches.");
      else if (data) {
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
              <div>Loading results...</div>
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

    // --- UPDATED: Routing Logic based on Status ---
    if (match.status === "live") {
      // Check if we have local data to resume
      const savedSetup = localStorage.getItem(`match_setup_${match.id}`);
      if (savedSetup) {
        setMatchSetupData(JSON.parse(savedSetup));
        navigate(`/scorer/match/${match.id}/live`);
      } else {
        // Match is live in DB but no local data? Force re-setup to be safe.
        // Or show toast "Resuming..."
        toast.warning("Resuming match setup...");
        navigate(`/scorer/match/${match.id}/setup`);
      }
    } else {
      // Upcoming -> Setup
      navigate(`/scorer/match/${match.id}/setup`);
    }
  };

  const handleMatchSetupComplete = (setupData: MatchSetupData) => {
    setMatchSetupData(setupData);
    navigate(`/scorer/match/${selectedMatch?.id}/live`);
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
      toast.error(`Failed to end match: ${error.message}`);
    } else {
      selectedMatch.scoreA = scoreA;
      selectedMatch.scoreB = scoreB;
      selectedMatch.status = "finished";
      // Cleanup Local Storage
      localStorage.removeItem(`match_setup_${selectedMatch.id}`);
      localStorage.removeItem(`match_timer_${selectedMatch.id}`);
      toast.success("Match ended and saved.");
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
    const checkSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) await fetchAndSetUserProfile(session.user);
      setSessionChecked(true);
    };
    checkSessionAndProfile();
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
      email,
      password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) await fetchAndSetUserProfile(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

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
