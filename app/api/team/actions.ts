"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyTeamOwnership(teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .eq('manager_id', user.id)
    .single();

  if (!team) return { ok: false, error: "Action non autorisée" };
  return { ok: true, error: null };
}

export async function addPlayer(playerData: {
  team_id: string;
  full_name: string;
  jersey_number: string;
  position: string;
  origin_village: string;
}) {
  const { ok, error } = await verifyTeamOwnership(playerData.team_id);
  if (!ok) return { success: false, error };

  if (!playerData.full_name.trim() || playerData.full_name === "Nouveau Joueur") {
    return { success: false, error: "Nom du joueur invalide" };
  }

  const adminSupabase = createAdminClient();

  // Check jersey number uniqueness within team
  const { data: existing } = await adminSupabase
    .from('players')
    .select('id')
    .eq('team_id', playerData.team_id)
    .eq('jersey_number', playerData.jersey_number)
    .maybeSingle();

  if (existing) return { success: false, error: `Le numéro ${playerData.jersey_number} est déjà pris` };

  const { data, error: insertError } = await adminSupabase
    .from('players')
    .insert([playerData])
    .select()
    .single();

  if (insertError) {
    console.error('[add_player_error]', insertError);
    return { success: false, error: insertError.message };
  }

  revalidatePath("/dashboard/my-team");
  return { success: true, data };
}

export async function updatePlayer(playerId: string, teamId: string, updates: Partial<{
  full_name: string;
  jersey_number: string;
  position: string;
  origin_village: string;
}>) {
  const { ok, error } = await verifyTeamOwnership(teamId);
  if (!ok) return { success: false, error };

  if (updates.full_name !== undefined && (!updates.full_name.trim() || updates.full_name === "Nouveau Joueur")) {
    return { success: false, error: "Nom du joueur invalide" };
  }

  const adminSupabase = createAdminClient();

  if (updates.jersey_number !== undefined) {
    const { data: existing } = await adminSupabase
      .from('players')
      .select('id')
      .eq('team_id', teamId)
      .eq('jersey_number', updates.jersey_number)
      .neq('id', playerId)
      .maybeSingle();

    if (existing) return { success: false, error: `Le numéro ${updates.jersey_number} est déjà pris` };
  }

  const { data, error: updateError } = await adminSupabase
    .from('players')
    .update(updates)
    .eq('id', playerId)
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

export async function addStaff(staffData: {
  team_id: string;
  first_name: string;
  last_name: string;
  role: string;
}) {
  const { ok, error } = await verifyTeamOwnership(staffData.team_id);
  if (!ok) return { success: false, error };

  const adminSupabase = createAdminClient();
  const { data, error: insertError } = await adminSupabase
    .from('staff')
    .insert([staffData])
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
