"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { REGISTRATION_FEE } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { TeamStatus } from "@/lib/types";

const VALID_STATUSES: TeamStatus[] = ['incomplete', 'pending', 'validated', 'rejected', 'locked'];

export async function updateTeamStatus(teamId: string, newStatus: string) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  if (!VALID_STATUSES.includes(newStatus as TeamStatus)) {
    return { success: false, error: `Statut invalide : ${newStatus}` };
  }

  const adminSupabase = createAdminClient();

  // 1. Update Team Status
  const { error: teamError } = await adminSupabase
    .from('teams')
    .update({ status: newStatus })
    .eq('id', teamId);

  if (teamError) {
    console.error('[updateTeamStatus] Error updating team:', teamError);
    return { success: false, error: teamError.message };
  }

  // 3. Revalidate paths to refresh UI
  revalidatePath('/admin/teams');
  revalidatePath('/admin/payments');
  revalidatePath('/admin');
  revalidatePath('/teams');
  revalidatePath('/');

  return { success: true };
}

export async function validatePayment(teamId: string) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const adminSupabase = createAdminClient();

  const { error: paymentError } = await adminSupabase
    .from('payments')
    .upsert({
      team_id: teamId,
      amount: REGISTRATION_FEE,
      status: 'paid',
      created_at: new Date().toISOString()
    }, { onConflict: 'team_id' });

  if (paymentError) {
    console.error('[validatePayment] Error creating payment:', paymentError);
    return { success: false, error: paymentError.message };
  }

  // Revalidate paths
  revalidatePath('/admin/payments');
  revalidatePath('/admin');

  return { success: true };
}
