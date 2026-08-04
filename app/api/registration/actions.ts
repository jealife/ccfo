"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { registrationSchema, type RegistrationFormData } from "@/lib/validation/registration";
import { revalidatePath } from "next/cache";

export async function submitTeamRegistration(formData: RegistrationFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  const parsed = registrationSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: `Données invalides : ${first?.message ?? "vérifiez le formulaire"}` };
  }
  const { teamInfo, staff, players, documents } = parsed.data;

  const admin = createAdminClient();

  // Une équipe validée ou verrouillée ne peut plus être modifiée par le manager.
  const { data: existingTeam } = await admin
    .from('teams')
    .select('id, status')
    .eq('manager_id', user.id)
    .maybeSingle();

  if (existingTeam && ['validated', 'locked'].includes(existingTeam.status)) {
    return { success: false, error: "Votre équipe est déjà validée : contactez l'administration pour toute modification." };
  }

  // 1. Upsert Team — le statut est décidé côté serveur, jamais par le client.
  const teamPayload: Record<string, unknown> = {
    manager_id: user.id,
    name: teamInfo.name,
    village: teamInfo.village,
    jersey_color: teamInfo.jersey_color,
    president_name: teamInfo.president_name,
    president_phone: teamInfo.president_phone,
    whatsapp: teamInfo.whatsapp,
    email: teamInfo.email,
    status: 'pending',
  };
  // Colonnes documents (nécessite la migration sql/add_team_documents.sql) —
  // on ne les envoie que si un document a été fourni, pour ne pas écraser l'existant.
  if (documents?.identity_docs) teamPayload.identity_docs_url = documents.identity_docs;
  if (documents?.village_attestation) teamPayload.village_attestation_url = documents.village_attestation;
  if (documents?.payment_receipt) teamPayload.payment_receipt_url = documents.payment_receipt;

  const { data: team, error: teamError } = await admin
    .from('teams')
    .upsert([teamPayload], { onConflict: 'manager_id' })
    .select()
    .single();

  if (teamError) {
    console.error('[registration] team upsert error:', teamError);
    return { success: false, error: teamError.message };
  }

  // 2. Staff : remplacement complet (pas d'état à préserver côté staff)
  if (staff.length > 0) {
    const staffData = staff.map((s) => {
      const [first_name, ...rest] = s.full_name.split(/\s+/);
      return {
        team_id: team.id,
        first_name,
        last_name: rest.join(' ') || first_name,
        full_name: s.full_name,
        role: s.role,
        origin_village: s.origin_village,
        date_of_birth: s.date_of_birth || null,
        photo_url: s.photo_url || null,
      };
    });

    const { error: deleteError } = await admin.from('staff').delete().eq('team_id', team.id);
    if (deleteError) {
      console.error('[registration] staff delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }
    const { error: staffError } = await admin.from('staff').insert(staffData);
    if (staffError) {
      console.error('[registration] staff insert error:', staffError);
      return { success: false, error: staffError.message };
    }
  }

  // 3. Joueurs : mise à jour par nom pour préserver les photos existantes,
  //    insertion des nouveaux, suppression de ceux retirés de la liste.
  if (players.length > 0) {
    const { data: existingPlayers } = await admin
      .from('players')
      .select('id, full_name')
      .eq('team_id', team.id);

    const existingByName = new Map((existingPlayers || []).map((p) => [p.full_name, p.id]));
    const submittedNames = new Set(players.map((p) => p.full_name));

    for (const p of players) {
      const payload = {
        team_id: team.id,
        full_name: p.full_name,
        jersey_number: p.jersey_number,
        position: p.position,
        date_of_birth: p.date_of_birth || null,
        origin_village: p.origin_village,
      };
      const existingId = existingByName.get(p.full_name);
      const { error: playerError } = existingId
        ? await admin.from('players').update(payload).eq('id', existingId)
        : await admin.from('players').insert([payload]);

      if (playerError) {
        console.error('[registration] player write error:', playerError);
        return { success: false, error: playerError.message };
      }
    }

    const toDelete = (existingPlayers || []).filter((p) => !submittedNames.has(p.full_name)).map((p) => p.id);
    if (toDelete.length > 0) {
      const { error: deleteError } = await admin.from('players').delete().in('id', toDelete);
      if (deleteError) console.error('[registration] player delete error:', deleteError);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin/teams');

  return { success: true };
}

// ── Sauvegarde du Brouillon (Sans validation stricte) ──

export async function saveRegistrationDraft(formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autorisé" };

  const admin = createAdminClient();

  const { data: existingTeam } = await admin
    .from('teams')
    .select('id, status')
    .eq('manager_id', user.id)
    .maybeSingle();

  if (existingTeam && ['validated', 'locked'].includes(existingTeam.status)) {
    return { success: false, error: "Équipe validée ou verrouillée" };
  }

  const { team: teamInfo, staff, players, documents } = formData;

  const teamPayload: Record<string, unknown> = {
    manager_id: user.id,
    name: teamInfo?.name?.trim() || "Brouillon",
    village: teamInfo?.village || null,
    jersey_color: teamInfo?.color || null,
    president_name: teamInfo?.president || null,
    president_phone: teamInfo?.phone || null,
    whatsapp: teamInfo?.whatsapp || null,
    email: teamInfo?.email || null,
    status: existingTeam?.status === 'pending' ? 'pending' : 'incomplete',
  };

  if (documents?.idCards) teamPayload.identity_docs_url = documents.idCards;
  if (documents?.certificate) teamPayload.village_attestation_url = documents.certificate;
  if (documents?.receipt) teamPayload.payment_receipt_url = documents.receipt;

  const { data: team, error: teamError } = await admin
    .from('teams')
    .upsert([teamPayload], { onConflict: 'manager_id' })
    .select()
    .single();

  if (teamError) return { success: false, error: teamError.message };

  // Staff
  const validStaff = (staff || []).filter((s: any) => s?.name?.trim());
  await admin.from('staff').delete().eq('team_id', team.id);
  if (validStaff.length > 0) {
    const staffData = validStaff.map((s: any) => {
      const [first_name, ...rest] = s.name.trim().split(/\s+/);
      return {
        team_id: team.id,
        first_name,
        last_name: rest.join(' ') || first_name,
        full_name: s.name.trim(),
        role: s.role || null,
        origin_village: s.village || null,
        date_of_birth: s.dob || null,
        photo_url: s.photo || null,
      };
    });
    await admin.from('staff').insert(staffData);
  }

  // Players
  const validPlayers = (players || []).filter((p: any) => p?.name?.trim());
  if (validPlayers.length > 0) {
    const { data: existingPlayers } = await admin
      .from('players')
      .select('id, full_name')
      .eq('team_id', team.id);

    const existingByName = new Map((existingPlayers || []).map((p) => [p.full_name, p.id]));
    const submittedNames = new Set(validPlayers.map((p: any) => p.name.trim()));

    for (const p of validPlayers) {
      const fullName = p.name.trim();
      const payload = {
        team_id: team.id,
        full_name: fullName,
        jersey_number: p.number ? parseInt(p.number) : null,
        position: p.position || null,
        date_of_birth: p.dob || null,
        origin_village: p.village || null,
      };
      const existingId = existingByName.get(fullName);
      if (existingId) {
        await admin.from('players').update(payload).eq('id', existingId);
      } else {
        await admin.from('players').insert([payload]);
      }
    }

    const toDelete = (existingPlayers || [])
      .filter((p) => !submittedNames.has(p.full_name))
      .map((p) => p.id);
    if (toDelete.length > 0) {
      await admin.from('players').delete().in('id', toDelete);
    }
  } else {
    await admin.from('players').delete().eq('team_id', team.id);
  }

  return { success: true };
}
