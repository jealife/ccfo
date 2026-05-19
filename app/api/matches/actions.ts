"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return { error: "Accès refusé" };
  return { error: null };
}

export async function updateMatchLive(id: string, updates: {
  status?: string;
  motm_player?: string;
  home_score?: number;
  away_score?: number;
  events?: unknown[];
  stats?: unknown[];
}) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();

  const { data: matchData, error: updateError } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[updateMatchLive] Error:', updateError);
    return { success: false, error: updateError.message };
  }

  if (updates.status === 'finished' || matchData.status === 'finished') {
    await recalculateStandings();
  }

  revalidatePath(`/admin/matches/${id}`);
  revalidatePath(`/matches/${id}`);
  revalidatePath('/matches');
  revalidatePath('/standings');
  revalidatePath('/');

  return { success: true, data: matchData };
}

export async function deleteMatch(id: string) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  await recalculateStandings();

  revalidatePath('/admin/matches');
  revalidatePath('/matches');
  revalidatePath('/standings');
  revalidatePath('/');

  return { success: true };
}

type TeamStats = {
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
};

async function recalculateStandings() {
  const supabase = createAdminClient();

  // Fetch config, matches and team names in parallel
  const [configResult, matchesResult, teamsResult] = await Promise.all([
    supabase
      .from('tournament_config')
      .select('points_win, points_draw, points_loss')
      .single(),
    supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score')
      .eq('status', 'finished'),
    supabase
      .from('teams')
      .select('id, name'),
  ]);

  // Scoring rules with safe fallbacks to FIFA standard (3-1-0)
  const pointsWin  = configResult.data?.points_win  ?? 3;
  const pointsDraw = configResult.data?.points_draw ?? 1;
  const pointsLoss = configResult.data?.points_loss ?? 0;

  const finishedMatches = matchesResult.data || [];
  const teamNames: Record<string, string> = {};
  for (const t of teamsResult.data || []) teamNames[t.id] = t.name;

  // Build stats from scratch for all finished matches
  const stats: Record<string, Omit<TeamStats, 'goal_diff' | 'position'>> = {};

  for (const match of finishedMatches) {
    const h = match.home_team_id;
    const a = match.away_team_id;

    if (!stats[h]) stats[h] = { team_id: h, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 };
    if (!stats[a]) stats[a] = { team_id: a, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 };

    stats[h].played++;
    stats[a].played++;
    stats[h].goals_for  += match.home_score ?? 0;
    stats[h].goals_against += match.away_score ?? 0;
    stats[a].goals_for  += match.away_score ?? 0;
    stats[a].goals_against += match.home_score ?? 0;

    const hs = match.home_score ?? 0;
    const as = match.away_score ?? 0;

    if (hs > as) {
      stats[h].won++;   stats[h].points += pointsWin;
      stats[a].lost++;  stats[a].points += pointsLoss;
    } else if (hs < as) {
      stats[a].won++;   stats[a].points += pointsWin;
      stats[h].lost++;  stats[h].points += pointsLoss;
    } else {
      stats[h].drawn++; stats[h].points += pointsDraw;
      stats[a].drawn++; stats[a].points += pointsDraw;
    }
  }

  // Compute goal_diff then sort: points → goal_diff → goals_for → alphabetical
  const sorted: TeamStats[] = Object.values(stats)
    .map(s => ({ ...s, goal_diff: s.goals_for - s.goals_against, position: 0 }))
    .sort((a, b) =>
      b.points - a.points ||
      b.goal_diff - a.goal_diff ||
      b.goals_for - a.goals_for ||
      (teamNames[a.team_id] || '').localeCompare(teamNames[b.team_id] || '')
    )
    .map((s, i) => ({ ...s, position: i + 1 }));

  // Upsert fresh standings — avoids race condition from delete+insert
  if (sorted.length > 0) {
    await supabase.from('standings').upsert(sorted, { onConflict: 'team_id' });
  }

  // Remove standings for teams that no longer have finished matches
  const activeTeamIds = sorted.map(s => s.team_id);
  const { data: existing } = await supabase.from('standings').select('team_id');
  const toDelete = (existing || []).map(r => r.team_id).filter(id => !activeTeamIds.includes(id));
  if (toDelete.length > 0) {
    await supabase.from('standings').delete().in('team_id', toDelete);
  }
}
