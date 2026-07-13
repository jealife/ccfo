"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyTeamOwnership } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const playerSchema = z.object({
  team_id: z.string().uuid(),
  full_name: z.string().trim().min(2, "Nom du joueur invalide").refine(n => n !== "Nouveau Joueur", "Nom du joueur invalide"),
  jersey_number: z.coerce.number().int().min(1, "Numéro invalide").max(99, "Numéro invalide"),
  position: z.string().trim().min(1),
  origin_village: z.string().trim().optional().default(""),
  date_of_birth: z.string().nullable().optional(),
});

export async function addPlayer(playerData: z.input<typeof playerSchema>) {
  const parsed = playerSchema.safeParse(playerData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { ok, error } = await verifyTeamOwnership(parsed.data.team_id);
  if (!ok) return { success: false, error };

  const adminSupabase = createAdminClient();

  // Check jersey number uniqueness within team
  const { data: existing } = await adminSupabase
    .from('players')
    .select('id')
    .eq('team_id', parsed.data.team_id)
    .eq('jersey_number', parsed.data.jersey_number)
    .maybeSingle();

  if (existing) return { success: false, error: `Le numéro ${parsed.data.jersey_number} est déjà pris` };

  const { data, error: insertError } = await adminSupabase
    .from('players')
    .insert([parsed.data])
    .select()
    .single();

  if (insertError) {
    console.error('[add_player_error]', insertError);
    return { success: false, error: insertError.message };
  }

  revalidatePath("/dashboard/my-team");
  return { success: true, data };
}

const playerUpdateSchema = playerSchema.omit({ team_id: true }).partial();

export async function updatePlayer(playerId: string, teamId: string, updates: z.input<typeof playerUpdateSchema>) {
  const { ok, error } = await verifyTeamOwnership(teamId);
  if (!ok) return { success: false, error };

  const parsed = playerUpdateSchema.safeParse(updates);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const adminSupabase = createAdminClient();

  if (parsed.data.jersey_number !== undefined) {
    const { data: existing } = await adminSupabase
      .from('players')
      .select('id')
      .eq('team_id', teamId)
      .eq('jersey_number', parsed.data.jersey_number)
      .neq('id', playerId)
      .maybeSingle();

    if (existing) return { success: false, error: `Le numéro ${parsed.data.jersey_number} est déjà pris` };
  }

  const { data: existingPlayer } = await adminSupabase
    .from('players')
    .select('team_id')
    .eq('id', playerId)
    .single();

  if (!existingPlayer || existingPlayer.team_id !== teamId) {
    return { success: false, error: 'Action non autorisée' };
  }

  const { data, error: updateError } = await adminSupabase
    .from('players')
    .update(parsed.data)
    .eq('id', playerId)
    .eq('team_id', teamId)
    .select()
    .single();

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/dashboard/my-team");
  return { success: true, data };
}

export async function deletePlayer(playerId: string, teamId: string) {
  const { ok, error } = await verifyTeamOwnership(teamId);
  if (!ok) return { success: false, error };

  const adminSupabase = createAdminClient();
  const { error: deleteError } = await adminSupabase
    .from('players')
    .delete()
    .eq('id', playerId)
    .eq('team_id', teamId);

  if (deleteError) return { success: false, error: deleteError.message };

  revalidatePath("/dashboard/my-team");
  return { success: true };
}

const staffSchema = z.object({
  team_id: z.string().uuid(),
  first_name: z.string().trim().min(1, "Prénom requis"),
  last_name: z.string().trim().min(1, "Nom requis"),
  role: z.string().trim().min(1, "Rôle requis"),
});

export async function addStaff(staffData: z.input<typeof staffSchema>) {
  const parsed = staffSchema.safeParse(staffData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { ok, error } = await verifyTeamOwnership(parsed.data.team_id);
  if (!ok) return { success: false, error };

  const adminSupabase = createAdminClient();
  const { data, error: insertError } = await adminSupabase
    .from('staff')
    .insert([{
      ...parsed.data,
      full_name: `${parsed.data.first_name} ${parsed.data.last_name}`,
    }])
    .select()
    .single();

  if (insertError) {
    console.error('[add_staff_error]', insertError);
    return { success: false, error: insertError.message };
  }

  revalidatePath("/dashboard/my-team");
  return { success: true, data };
}

export async function deleteStaff(staffId: string, teamId: string) {
  const { ok, error } = await verifyTeamOwnership(teamId);
  if (!ok) return { success: false, error };

  const adminSupabase = createAdminClient();
  const { error: deleteError } = await adminSupabase
    .from('staff')
    .delete()
    .eq('id', staffId)
    .eq('team_id', teamId);

  if (deleteError) return { success: false, error: deleteError.message };

  revalidatePath("/dashboard/my-team");
  return { success: true };
}
