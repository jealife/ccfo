"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTournamentConfig() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('tournament_config')
    .select('*')
    .single();

  if (error) {
    console.error("Error fetching tournament config:", error);
    return null;
  }

  return data;
}

export async function updateTournamentConfig(configData: {
  name?: string;
  start_date?: string;
  end_date?: string;
  registration_deadline?: string;
  max_teams?: number;
  players_per_team?: number;
  staff_per_team?: number;
  is_active?: boolean;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { success: false, error: "Accès refusé" };

  const { error } = await supabase
    .from('tournament_config')
    .upsert({
      id: 1,
      ...configData,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Error updating tournament config:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tournaments');
  revalidatePath('/');

  return { success: true };
}
