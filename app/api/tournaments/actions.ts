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

export async function updateTournamentConfig(configData: any) {
  const supabase = await createClient();
  
  // We assume there's only one config row (id: 1 or similar)
  // or we upsert based on a known key
  const { error } = await supabase
    .from('tournament_config')
    .upsert({ 
      id: 1, // Global config
      ...configData,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Error updating tournament config:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tournaments');
  revalidatePath('/(public)');
  revalidatePath('/');
  
  return { success: true };
}
