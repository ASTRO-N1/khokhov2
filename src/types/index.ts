// Type definitions for the Kho-Kho tournament system

export type MatchStatus = "upcoming" | "live" | "finished";
export type PlayerRole = "playing" | "substitute";
export type ActionType =
  | "touch"
  | "kho"
  | "out"
  | "foul"
  | "yellow"
  | "red"
  | "sub";
export type TeamType = "attacker" | "defender";

export interface User {
  id: string;
  name: string;
  email: string;
  // Added 'viewer' to role
  role: "admin" | "scorer" | "viewer" | "superadmin";
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  type: string;
  status: "upcoming" | "ongoing" | "completed";
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  captain: string;
  coach?: string;
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  teamId: string;
  role: PlayerRole;
  isActive: boolean;
  isCaptain?: boolean;
}

export interface Match {
  id: string;
  matchNumber: string;
  tournamentId: string;
  tournamentName: string;
  teamA: Team;
  teamB: Team;
  dateTime: string;
  venue: string;
  status: MatchStatus;
  scorerId?: string;
  scorerName?: string;
  scoreA?: number;
  scoreB?: number;
  innings?: number;
  turnDuration?: number; // in seconds
  playersPerTeam?: 7 | 9;
  tossWinner?: "A" | "B";
  tossDecision?: "attack" | "defend";
}

export type SymbolType =
  | "simple-touch"
  | "sudden-attack"
  | "late-entry"
  | "pole-dive"
  | "out-of-field"
  | "dive"
  | "retired"
  | "warning"
  | "tap"
  | "turn-closure"
  | "yellow-card"
  | "red-card";

export interface ScoringAction {
  id?: string;
  matchId: string;
  turn: number;
  inning: number;
  attackerJersey: number;
  attackerName: string;
  defenderJersey: number;
  defenderName: string;
  symbol: SymbolType;
  actionType: ActionType;
  points: number;
  runTime: number; // Timer value when defender is out
  perTime: number; // Time defender was active
  timestamp: string;
  scoringTeamId: string; // ID of the team that scored
  currentInning?: number;
  currentTurn?: number;
  turnStartTime?: string;
  // Added for compatibility with Viewer components (optional)
  team?: "A" | "B";
}

export interface DefenderScore {
  jerseyNumber: number;
  name: string;
  perTime: number;
  runTime: number;
  outBy: string; // Attacker name
  inning: number;
}

export interface AttackerScore {
  jerseyNumber: number;
  name: string;
  totalPoints: number;
  defendersOut: string[]; // List of defender names
  inning: number;
}

// --- Viewer Specific Interfaces ---

export interface LiveMatch extends Match {
  currentInning: number;
  currentTurn: number;
  attackingTeam: "A" | "B";
  turnStartTime: string;
  turnTimeRemaining: number;
  actions: ScoringAction[];
}
