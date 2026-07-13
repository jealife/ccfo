"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { computeStandings } from "@/lib/standings";
import { revalidatePath } from "next/cache";

const matchEventSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.enum(["goal", "yellow", "red", "substitution"]),
  minute: z.coerce.number().int().min(0).max(150),
  player: z.string().trim().min(1),
  playerIn: z.string().optional(),
  team: z.enum(["home", "away"]),
});

const matchStatSchema = z.union([
  z.object({ label: z.string(), home: z.union([z.number(), z.string()]), away: z.union([z.number(), z.string()]) }),
  z.object({ label: z.literal("started_at"), value: z.string() }),
]);

const matchUpdateSchema = z.object({
  status: z.enum(["scheduled", "live", "finished"]).optional(),
  motm_player: z.string().optional(),
  home_score: z.number().int().min(0).optional(),
  away_score: z.number().int().min(0).optional(),
  events: z.array(matchEventSchema).optional(),
  stats: z.array(matchStatSchema).optional(),
});

export async function updateMatchLive(id: string, updates: z.input<typeof matchUpdateSchema>) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const parsed = matchUpdateSchema.safeParse(updates);
  if (!parsed.success) {
    return { success: false, error: "Données invalides : " + parsed.error.issues.map(i => `${i.path.join('.')} ${i.message}`).join(', ') };
  }

  const supabase = createAdminClient();

  const { data: matchData, error: updateError } = await supabase
    .from('matches')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[updateMatchLive] Error:', updateError);
    return { success: false, error: updateError.message };
  }

  if (parsed.data.status === 'finished' || matchData.status === 'finished') {
    await recalculateStandings();
  }

  revalidatePath(`/admin/matches/${id}`);
  revalidatePath(`/matches/${id}`);
  revalidatePath('/matches');
  revalidatePath('/standings');
  revalidatePath('/');

  return { success: true, data: matchData };
}

const matchCreateSchema = z.object({
  home_team_id: z.string().uuid("Équipe domicile requise"),
  away_team_id: z.string().uuid("Équipe extérieur requise"),
  match_date: z.string().min(1, "Date requise"),
  venue: z.string().trim().optional().default(""),
  status: z.enum(["scheduled", "live", "finished"]).default("scheduled"),
  group_name: z.string().trim().min(1, "Phase requise"),
});

export async function createMatch(matchData: z.input<typeof matchCreateSchema>) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const parsed = matchCreateSchema.safeParse(matchData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  if (parsed.data.home_team_id === parsed.data.away_team_id) {
    return { success: false, error: "Une équipe ne peut pas s'affronter elle-même" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('matches').insert([parsed.data]);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/matches');
  revalidatePath('/matches');
  revalidatePath('/');

  return { success: true };
}

export async function deleteMatch(id: string) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const supabase = createAdminClient();
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

  const [configResult, matchesResult, teamsResult] = await Promise.all([
    supabase
      .from('tournament_config')
      .select('points_win, points_draw, points_loss')
      .single(),
    supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score, group_name')
      .eq('status', 'finished'),
    supabase
      .from('teams')
      .select('id, name'),
  ]);

  const teamNames: Record<string, string> = {};
  for (const t of teamsResult.data || []) teamNames[t.id] = t.name;

  const allSorted = computeStandings(matchesResult.data || [], teamNames, {
    points_win:  configResult.data?.points_win  ?? 3,
    points_draw: configResult.data?.points_draw ?? 1,
    points_loss: configResult.data?.points_loss ?? 0,
  });

  if (allSorted.length > 0) {
    await supabase.from('standings').upsert(allSorted, { onConflict: 'team_id' });
  }

  // Supprimer les équipes sans match de groupe terminé
  const activeTeamIds = allSorted.map((s) => s.team_id);
  const { data: existing } = await supabase.from('standings').select('team_id');
  const toDelete = (existing || []).map((r) => r.team_id).filter((id) => !activeTeamIds.includes(id));
  if (toDelete.length > 0) {
    await supabase.from('standings').delete().in('team_id', toDelete);
  }
}
