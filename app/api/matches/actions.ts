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

async function recalculateStandings() {
  const supabase = createAdminClient();

  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id, home_score, away_score')
    .eq('status', 'finished');

  if (!finishedMatches || finishedMatches.length === 0) return;

  const stats: Record<string, {
    team_id: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goals_for: number;
    goals_against: number;
    points: number;
  }> = {};

  for (const match of finishedMatches) {
    const homeId = match.home_team_id;
    const awayId = match.away_team_id;

    if (!stats[homeId]) stats[homeId] = { team_id: homeId, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 };
    if (!stats[awayId]) stats[awayId] = { team_id: awayId, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 };

    stats[homeId].played++;
    stats[awayId].played++;
    stats[homeId].goals_for += match.home_score ?? 0;
    stats[homeId].goals_against += match.away_score ?? 0;
    stats[awayId].goals_for += match.away_score ?? 0;
    stats[awayId].goals_against += match.home_score ?? 0;

    if (match.home_score > match.away_score) {
      stats[homeId].won++;
      stats[homeId].points += 3;
      stats[awayId].lost++;
    } else if (match.home_score < match.away_score) {
      stats[awayId].won++;
      stats[awayId].points += 3;
      stats[homeId].lost++;
    } else {
      stats[homeId].drawn++;
      stats[homeId].points += 1;
      stats[awayId].drawn++;
      stats[awayId].points += 1;
    }
  }

  await Promise.all(
    Object.values(stats).map(stat =>
      supabase.from('standings').upsert(stat, { onConflict: 'team_id' })
    )
  );
}
