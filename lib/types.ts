// ── Types partagés pour toute l'application CCFO ─────────────

export type MatchStatus   = "scheduled" | "live" | "finished";
export type EventType     = "goal" | "yellow" | "red" | "substitution";
export type PlayerRole    = "GK" | "DEF" | "MID" | "ATT" | "FWD";
export type TeamStatus    = "incomplete" | "pending" | "validated" | "rejected" | "locked";
export type UserRole      = "admin" | "manager";

export interface Player {
  id: string;
  full_name: string;
  jersey_number?: number | null;
  position?: string | null;
  photo_url?: string | null;
  team_id?: string;
  date_of_birth?: string | null;
  origin_village?: string | null;
}

export interface Team {
  id: string;
  name: string;
  village?: string | null;
  status?: TeamStatus;
  jersey_color?: string | null;
  manager_id?: string | null;
  president_name?: string | null;
  president_phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  identity_docs_url?: string | null;
  village_attestation_url?: string | null;
  payment_receipt_url?: string | null;
  players?: Player[];
}

export interface MatchEvent {
  id: string;
  type: EventType;
  minute: number;
  player: string;
  playerIn?: string;
  team: "home" | "away";
}

export interface MatchStat {
  label: string;
  home: number | string;
  away: number | string;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  status: MatchStatus;
  group_name?: string | null;
  venue?: string | null;
  events?: MatchEvent[];
  stats?: (MatchStat | { label: "started_at"; value: string })[];
  motm_player?: string | null;
  home?: Team;
  away?: Team;
}

export interface Standing {
  team_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  position: number;
  group_name?: string | null;
  teams?: Pick<Team, "name">;
}

export interface TournamentConfig {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_teams: number;
  players_per_team: number;
  staff_per_team: number;
  is_active: boolean;
  points_win: number;
  points_draw: number;
  points_loss: number;
  qualification_spots: number;
  updated_at?: string;
}
