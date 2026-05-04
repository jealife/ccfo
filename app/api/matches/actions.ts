"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMatchLive(id: string, updates: any) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateMatchLive] Error:', error);
    return { success: false, error: error.message };
  }

  // Revalidate both admin and public pages
  revalidatePath(`/admin/matches/${id}`);
  revalidatePath(`/matches/${id}`);
  revalidatePath('/matches');
  revalidatePath('/');

  return { success: true, data };
}
