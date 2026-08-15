"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyTeamOwnership } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { translateDbError } from "@/lib/errors";

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

async function verifyStaffOwnership(staffId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: member } = await supabase
    .from('staff')
    .select('team_id')
    .eq('id', staffId)
    .single();

  if (!member) return { ok: false, error: "Action non autorisée" };
  return verifyTeamOwnership(member.team_id);
}

/** L'URL doit pointer vers notre bucket Supabase Storage */
function isStoragePhotoUrl(photoUrl: string) {
  return photoUrl.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`);
}

export async function updateStaffPhoto(staffId: string, photoUrl: string) {
  const { ok, error } = await verifyStaffOwnership(staffId);
  if (!ok) return { success: false, error };

  if (!isStoragePhotoUrl(photoUrl)) {
    return { success: false, error: "URL de photo invalide" };
  }

  const adminSupabase = createAdminClient();
  const { data, error: updateError } = await adminSupabase
    .from('staff')
    .update({ photo_url: photoUrl })
    .eq('id', staffId)
    .select()
    .single();

  if (updateError) {
    console.error('[update_staff_photo]', updateError);
    return { success: false, error: translateDbError(updateError.message) };
  }

  revalidatePath('/dashboard/my-team');
  return { success: true, data };
}

export async function updatePlayerPhoto(playerId: string, photoUrl: string) {
  const { ok, error } = await verifyPlayerOwnership(playerId);
  if (!ok) return { success: false, error };

  if (!isStoragePhotoUrl(photoUrl)) {
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
    return { success: false, error: translateDbError(updateError.message) };
  }

  revalidatePath('/dashboard/my-team');
  return { success: true, data };
}

/** L'URL doit pointer vers notre bucket Supabase Storage (même contrôle que pour les photos) */
function isStorageUrl(url: string) {
  return url.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`);
}

export async function updateStaffDocument(staffId: string, docUrl: string) {
  const { ok, error } = await verifyStaffOwnership(staffId);
  if (!ok) return { success: false, error };

  if (!isStorageUrl(docUrl)) {
    return { success: false, error: "URL de document invalide" };
  }

  const adminSupabase = createAdminClient();
  const { data, error: updateError } = await adminSupabase
    .from('staff')
    .update({ identity_docs_url: docUrl })
    .eq('id', staffId)
    .select()
    .single();

  if (updateError) {
    console.error('[update_staff_document]', updateError);
    return { success: false, error: translateDbError(updateError.message) };
  }

  revalidatePath('/dashboard/my-team');
  return { success: true, data };
}

export async function updatePlayerDocument(playerId: string, docUrl: string) {
  const { ok, error } = await verifyPlayerOwnership(playerId);
  if (!ok) return { success: false, error };

  if (!isStorageUrl(docUrl)) {
    return { success: false, error: "URL de document invalide" };
  }

  const adminSupabase = createAdminClient();
  const { data, error: updateError } = await adminSupabase
    .from('players')
    .update({ identity_docs_url: docUrl })
    .eq('id', playerId)
    .select()
    .single();

  if (updateError) {
    console.error('[update_player_document]', updateError);
    return { success: false, error: translateDbError(updateError.message) };
  }

  revalidatePath('/dashboard/my-team');
  return { success: true, data };
}

export async function updateStaffBirthCertificate(staffId: string, docUrl: string) {
  const { ok, error } = await verifyStaffOwnership(staffId);
  if (!ok) return { success: false, error };

  if (!isStorageUrl(docUrl)) {
    return { success: false, error: "URL de document invalide" };
  }

  const adminSupabase = createAdminClient();
  const { data, error: updateError } = await adminSupabase
    .from('staff')
    .update({ birth_certificate_url: docUrl })
    .eq('id', staffId)
    .select()
    .single();

  if (updateError) {
    console.error('[update_staff_birth_certificate]', updateError);
    return { success: false, error: translateDbError(updateError.message) };
  }

  revalidatePath('/dashboard/my-team');
  return { success: true, data };
}

export async function updatePlayerBirthCertificate(playerId: string, docUrl: string) {
  const { ok, error } = await verifyPlayerOwnership(playerId);
  if (!ok) return { success: false, error };

  if (!isStorageUrl(docUrl)) {
    return { success: false, error: "URL de document invalide" };
  }

  const adminSupabase = createAdminClient();
  const { data, error: updateError } = await adminSupabase
    .from('players')
    .update({ birth_certificate_url: docUrl })
    .eq('id', playerId)
    .select()
    .single();

  if (updateError) {
    console.error('[update_player_birth_certificate]', updateError);
    return { success: false, error: translateDbError(updateError.message) };
  }

  revalidatePath('/dashboard/my-team');
  return { success: true, data };
}
