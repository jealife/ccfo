"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPlayer(playerData: {
  team_id: string;
  full_name: string;
  jersey_number: string;
  position: string;
  origin_village: string;
}) {
  const supabase = await createClient();
  
  // 1. Verify manager owns the team
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', playerData.team_id)
    .eq('manager_id', user.id)
    .single();

  if (!team) return { success: false, error: "Action non autorisée" };

  // 2. Insert player using Admin Client to bypass RLS
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from('players')
    .insert([playerData])
    .select()
    .single();

  if (error) {
    console.error('[add_player_error]', error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/my-team");
  return { success: true, data };
}

export async function addStaff(staffData: {
  team_id: string;
  first_name: string;
  last_name: string;
  role: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', staffData.team_id)
    .eq('manager_id', user.id)
    .single();

  if (!team) return { success: false, error: "Action non autorisée" };

  // 2. Insert staff using Admin Client
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from('staff')
    .insert([staffData])
    .select()
    .single();

  if (error) {
    console.error('[add_staff_error]', error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/my-team");
  return { success: true, data };
}
