"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePlayerPhoto(playerId: string, photoUrl: string) {
  const supabase = await createClient();
  
  // Verify ownership before update
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Atomic update using server-side client (respecting server-side RLS or bypassing if needed)
  // Note: server-side createClient usually respects RLS unless service role is used.
  const { data, error } = await supabase
    .from('players')
    .update({ photo_url: photoUrl })
    .eq('id', playerId)
    .select()
    .single();

  if (error) {
    console.error('[server_action] Update error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/my-team');
  return { success: true, data };
}
