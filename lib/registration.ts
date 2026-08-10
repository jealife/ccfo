import { createAdminClient } from "@/lib/supabase/server";

/** Nombre d'équipes du tournoi si `tournament_config` est injoignable. */
export const DEFAULT_MAX_TEAMS = 8;

export type RegistrationStatus = {
  teamCount: number;
  maxTeams: number;
  isOpen: boolean;
};

/**
 * Places restantes dans le tournoi.
 *
 * Une équipe rejetée ne consomme pas sa place : elle est exclue du décompte.
 * Les autres statuts (incomplete, pending, validated, locked) occupent une
 * place, y compris un dossier encore incomplet — sinon un dossier en cours de
 * remplissage pourrait se faire doubler.
 *
 * `teams` n'est pas lisible sous RLS par un visiteur anonyme : la lecture passe
 * par le service role. Aucune donnée d'équipe n'est exposée, seul le compte.
 */
export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  const admin = createAdminClient();

  const [configRes, teamsRes] = await Promise.all([
    admin.from('tournament_config').select('max_teams').maybeSingle(),
    admin.from('teams').select('id', { count: 'exact', head: true }).neq('status', 'rejected'),
  ]);

  const maxTeams = configRes.data?.max_teams ?? DEFAULT_MAX_TEAMS;
  const teamCount = teamsRes.count ?? 0;

  return { teamCount, maxTeams, isOpen: teamCount < maxTeams };
}

/**
 * Indique si les inscriptions (création de compte manager + soumission de
 * fiche d'équipe) sont ouvertes, selon le champ `registrations_open` de
 * `tournament_config`. Indépendant de `is_active`.
 */
export async function isRegistrationOpen(): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tournament_config')
    .select('registrations_open')
    .maybeSingle();

  return data?.registrations_open ?? true;
}
