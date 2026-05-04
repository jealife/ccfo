"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitTeamRegistration(formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autorisé");

  // 1. Insert Team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert([{
      manager_id: user.id,
      name: formData.teamInfo.name,
      village: formData.teamInfo.village,
      jersey_color: formData.teamInfo.jersey_color,
      president_name: formData.teamInfo.president_name,
      president_phone: formData.teamInfo.president_phone,
      whatsapp: formData.teamInfo.whatsapp,
      email: formData.teamInfo.email,
      status: 'pending'
    }])
    .select()
    .single();

  if (teamError) throw teamError;

  // 2. Insert Staff
  const staffData = formData.staff.map((s: any) => ({
    team_id: team.id,
    last_name: s.last_name,
    first_name: s.first_name,
    full_name: `${s.first_name} ${s.last_name}`,
    nationality: s.nationality || 'Gabonaise',
    role: s.role,
    origin_village: s.origin_village
  }));

  const { error: staffError } = await supabase.from('staff').insert(staffData);
  if (staffError) throw staffError;

  // 3. Insert Players
  const playersData = formData.players.map((p: any) => ({
    team_id: team.id,
    full_name: p.full_name,
    jersey_number: parseInt(p.jersey_number),
    position: p.position,
    birth_date: p.birth_date,
    origin_village: p.origin_village
  }));

  const { error: playersError } = await supabase.from('players').insert(playersData);
  if (playersError) throw playersError;

  revalidatePath('/dashboard');
  revalidatePath('/admin/teams');
  
  return { success: true };
}
