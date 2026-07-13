// ── Calcul pur du classement (testable sans DB) ──────────────

import { GROUP_PHASES } from "@/lib/helpers";

export type StandingRow = {
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
  group_name: string;
};

export type FinishedMatch = {
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  group_name: string | null;
};

export type PointsConfig = {
  points_win: number;
  points_draw: number;
  points_loss: number;
};

/**
 * Calcule le classement par groupe à partir des matchs de phase de groupes terminés.
 * Tri : points, différence de buts, buts marqués, puis ordre alphabétique.
 */
export function computeStandings(
  matches: FinishedMatch[],
  teamNames: Record<string, string>,
  config: PointsConfig
): StandingRow[] {
  const { points_win, points_draw, points_loss } = config;

  const groupMatches = matches.filter(
    (m) => m.group_name && (GROUP_PHASES as readonly string[]).includes(m.group_name)
  );

  type RawStats = Omit<StandingRow, 'goal_diff' | 'position'>;
  const stats: Record<string, RawStats> = {};

  for (const match of groupMatches) {
    const h = match.home_team_id;
    const a = match.away_team_id;
    const group = match.group_name as string;

    if (!stats[h]) stats[h] = { team_id: h, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, group_name: group };
    if (!stats[a]) stats[a] = { team_id: a, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, group_name: group };

    stats[h].played++;
    stats[a].played++;
    stats[h].goals_for     += match.home_score ?? 0;
    stats[h].goals_against += match.away_score ?? 0;
    stats[a].goals_for     += match.away_score ?? 0;
    stats[a].goals_against += match.home_score ?? 0;

    const hs = match.home_score ?? 0;
    const as = match.away_score ?? 0;

    if (hs > as) {
      stats[h].won++;   stats[h].points += points_win;
      stats[a].lost++;  stats[a].points += points_loss;
    } else if (hs < as) {
      stats[a].won++;   stats[a].points += points_win;
      stats[h].lost++;  stats[h].points += points_loss;
    } else {
      stats[h].drawn++; stats[h].points += points_draw;
      stats[a].drawn++; stats[a].points += points_draw;
    }
  }

  // Trier par groupe puis assigner la position au sein du groupe
  const allSorted: StandingRow[] = [];
  for (const group of GROUP_PHASES) {
    const groupTeams = Object.values(stats)
      .filter((s) => s.group_name === group)
      .map((s) => ({ ...s, goal_diff: s.goals_for - s.goals_against, position: 0 }))
      .sort((a, b) =>
        b.points - a.points ||
        b.goal_diff - a.goal_diff ||
        b.goals_for - a.goals_for ||
        (teamNames[a.team_id] || '').localeCompare(teamNames[b.team_id] || '')
      )
      .map((s, i) => ({ ...s, position: i + 1 }));
    allSorted.push(...groupTeams);
  }

  return allSorted;
}
