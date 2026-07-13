"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyTeamOwnership } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyPlayerOwnership(playerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: player } = await supabase
    .from('players')
    .select('team_id')
    .eq('id', playerId)
    .single();

  if (!player) return { ok: false, error: "Action non autorisée" };
  return verifyTeamOwnership(player.team_id);
}

export async function updatePlayerPhoto(playerId: string, photoUrl: string) {
  const { ok, error } = await verifyPlayerOwnership(playerId);
  if (!ok) return { success: false, error };

  // L'URL doit pointer vers notre bucket Supabase Storage
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
  if (!photoUrl.startsWith(allowedPrefix)) {
    return { success: false, error: "URL de photo invalide" };
  }

  const adminSupabase = createAdminClient();
  const { data, error: updateError } = await adminSupabase
    .from('players')
    .update({ photo_url: photoUrl })
    .eq('id', playerId)
    .select()
    .single();

  if (updateError) {
    console.error('[server_action] Update error:', updateError);
    return { success: false, error: updateError.message };
  }

  revalidatePath('/dashboard/my-team');
  return { success: true, data };
}
