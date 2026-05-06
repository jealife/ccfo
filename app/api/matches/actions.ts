"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMatchLive(id: string, updates: any) {
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

  // If match is finished, recalculate standings
  if (updates.status === 'finished' || matchData.status === 'finished') {
    await recalculateStandings();
  }

  // Revalidate both admin and public pages
  revalidatePath(`/admin/matches/${id}`);
  revalidatePath(`/matches/${id}`);
  revalidatePath('/matches');
  revalidatePath('/');

  return { success: true, data: matchData };
}

async function recalculateStandings() {
  const supabase = await createClient();
  
  // 1. Get all finished matches
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished');

  if (!finishedMatches) return;

  // 2. Map to calculate stats per team
  const stats: Record<string, any> = {};

  finishedMatches.forEach(match => {
    const homeId = match.home_team_id;
    const awayId = match.away_team_id;

    if (!stats[homeId]) stats[homeId] = { team_id: homeId, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 };
    if (!stats[awayId]) stats[awayId] = { team_id: awayId, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 };

    stats[homeId].played++;
    stats[awayId].played++;
    stats[homeId].goals_for += match.home_score;
    stats[homeId].goals_against += match.away_score;
    stats[awayId].goals_for += match.away_score;
    stats[awayId].goals_against += match.home_score;

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
  });

  // 3. Update standings table
  for (const teamId in stats) {
    const { error } = await supabase
      .from('standings')
      .upsert(stats[teamId], { onConflict: 'team_id' });
    
    if (error) console.error(`Error updating standings for team ${teamId}:`, error);
  }
}
