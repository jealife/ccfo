"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitTeamRegistration(formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autorisé");

  // 1. Upsert Team (Allow partial registration)
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .upsert([{
      manager_id: user.id,
      name: formData.teamInfo.name,
      village: formData.teamInfo.village,
      jersey_color: formData.teamInfo.jersey_color,
      president_name: formData.teamInfo.president_name,
      president_phone: formData.teamInfo.president_phone,
      whatsapp: formData.teamInfo.whatsapp,
      email: formData.teamInfo.email,
      status: formData.teamInfo.status || 'pending',
      // Document URLs (Can be empty initially)
      identity_docs_url: formData.documents?.identity_docs || null,
      village_attestation_url: formData.documents?.village_attestation || null,
      payment_receipt_url: formData.documents?.payment_receipt || null
    }], { onConflict: 'manager_id' })
    .select()
    .single();

  if (teamError) throw teamError;

  // 2. Insert/Update Staff (Filter out empty members)
  const staffData = formData.staff
    .filter((s: any) => s.last_name || s.first_name)
    .map((s: any) => ({
      team_id: team.id,
      last_name: s.last_name,
      first_name: s.first_name,
      full_name: `${s.first_name} ${s.last_name}`,
      nationality: s.nationality || 'Gabonaise',
      role: s.role,
      origin_village: s.origin_village
    }));

  if (staffData.length > 0) {
    // Delete old staff before re-inserting to simplify (or use upsert if IDs are tracked)
    await supabase.from('staff').delete().eq('team_id', team.id);
    const { error: staffError } = await supabase.from('staff').insert(staffData);
    if (staffError) throw staffError;
  }

  // 3. Insert/Update Players (Filter out empty players)
  const playersData = formData.players
    .filter((p: any) => p.full_name)
    .map((p: any) => ({
      team_id: team.id,
      full_name: p.full_name,
      jersey_number: parseInt(p.jersey_number) || 0,
      position: p.position,
      birth_date: p.birth_date || null,
      origin_village: p.origin_village
    }));

  if (playersData.length > 0) {
    // For players, we might want to preserve photos if they exist
    // Simple approach: delete and re-insert (but we lose photos)
    // Better approach: use upsert if we have IDs, or just keep what's there and add new ones.
    // For now, let's keep it simple: insert new ones, don't delete to avoid losing photos.
    // We'll filter out players that already exist by name/team_id or similar if needed.
    const { error: playersError } = await supabase.from('players').upsert(playersData, { onConflict: 'team_id,full_name' });
    if (playersError) throw playersError;
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin/teams');
  
  return { success: true };
}

