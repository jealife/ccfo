"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTeamStatus(teamId: string, newStatus: string) {
  const supabase = await createClient();

  // 1. Update Team Status
  const { error: teamError } = await supabase
    .from('teams')
    .update({ status: newStatus })
    .eq('id', teamId);

  if (teamError) {
    console.error('[updateTeamStatus] Error updating team:', teamError);
    return { success: false, error: teamError.message };
  }

  // 2. If validated, handle payment
  if (newStatus === 'validated') {
    const { error: paymentError } = await supabase
      .from('payments')
      .upsert({
        team_id: teamId,
        amount: 400000,
        status: 'paid',
        created_at: new Date().toISOString()
      }, { onConflict: 'team_id' });

    if (paymentError) {
      console.error('[updateTeamStatus] Error creating payment:', paymentError);
      // We don't fail the whole action if payment fails, but we log it
    }
  }

  // 3. Revalidate paths to refresh UI
  revalidatePath('/admin/teams');
  revalidatePath('/admin/payments');
  revalidatePath('/admin');
  revalidatePath('/teams');
  revalidatePath('/');

  return { success: true };
}
