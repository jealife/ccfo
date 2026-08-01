"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { REGISTRATION_FEE } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { TeamStatus } from "@/lib/types";

const VALID_STATUSES: TeamStatus[] = ['incomplete', 'pending', 'validated', 'rejected', 'locked'];

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Écrit la ligne `payments` correspondant aux frais d'affiliation d'une équipe.
 * Un seul paiement par équipe : on met à jour l'existant s'il y en a un, sinon
 * on l'insère. (Pas d'upsert : aucune contrainte d'unicité n'est garantie sur
 * `payments.team_id` — voir sql/add_payment_unique_team.sql.)
 */
async function recordAffiliationPayment(
  admin: AdminClient,
  teamId: string,
  status: 'paid' | 'pending',
  validatedBy: string | null
) {
  const { data: team } = await admin
    .from('teams')
    .select('payment_receipt_url')
    .eq('id', teamId)
    .maybeSingle();

  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const payload = {
    team_id: teamId,
    amount: REGISTRATION_FEE,
    status,
    receipt_url: team?.payment_receipt_url ?? null,
    validated_by: status === 'paid' ? validatedBy : null,
  };

  const { error } = existing
    ? await admin.from('payments').update(payload).eq('id', existing.id)
    : await admin.from('payments').insert({ ...payload, created_at: new Date().toISOString() });

  return error;
}

/**
 * Équipes + leur paiement, pour le tableau admin des paiements.
 * `payments` n'est pas lisible sous RLS : la lecture passe par le service role,
 * derrière un contrôle de rôle admin.
 */
export async function getTeamsWithPayments() {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError, data: [] };

  const { data, error } = await createAdminClient()
    .from('teams')
    .select('id, name, village, status, payment_receipt_url, payments(id, amount, status, created_at, receipt_url)')
    .order('name', { ascending: true });

  if (error) {
    console.error('[getTeamsWithPayments]', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, error: null, data: data ?? [] };
}

export async function updateTeamStatus(teamId: string, newStatus: string) {
  const { error: authError, userId } = await requireAdmin();
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

  // 2. Le paiement suit le statut de l'équipe : validée => reçu officiel émis,
  //    tout autre statut => le reçu ne doit plus compter comme encaissé.
  const paymentError = await recordAffiliationPayment(
    adminSupabase,
    teamId,
    newStatus === 'validated' ? 'paid' : 'pending',
    userId
  );

  if (paymentError) {
    console.error('[updateTeamStatus] Error syncing payment:', paymentError);
    return { success: false, error: paymentError.message };
  }

  // 3. Revalidate paths to refresh UI
  revalidatePath('/admin/teams');
  revalidatePath('/admin/payments');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/receipt');
  revalidatePath('/teams');
  revalidatePath('/');

  return { success: true };
}

/**
 * Rouvre (ou referme) l'effectif d'une équipe validée, pour que son manager
 * puisse à nouveau ajouter ou retirer des joueurs / membres du staff.
 * Volontairement distinct du statut : rouvrir l'accès ne dévalide pas
 * l'équipe et n'annule donc ni son reçu ni sa place au classement.
 */
export async function setRegistrationUnlocked(teamId: string, unlocked: boolean) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { error } = await createAdminClient()
    .from('teams')
    .update({ registration_unlocked: unlocked })
    .eq('id', teamId);

  if (error) {
    console.error('[setRegistrationUnlocked]', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/teams');
  revalidatePath('/dashboard/my-team');

  return { success: true };
}

export async function validatePayment(teamId: string) {
  const { error: authError, userId } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const adminSupabase = createAdminClient();
  const paymentError = await recordAffiliationPayment(adminSupabase, teamId, 'paid', userId);

  if (paymentError) {
    console.error('[validatePayment] Error creating payment:', paymentError);
    return { success: false, error: paymentError.message };
  }

  revalidatePath('/admin/payments');
  revalidatePath('/admin');
  revalidatePath('/dashboard/receipt');

  return { success: true };
}
