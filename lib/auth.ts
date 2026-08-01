import { createClient } from "@/lib/supabase/server";

/**
 * Vérifie que l'utilisateur courant est authentifié et a le rôle admin.
 * Retourne { error: null, userId } si OK, sinon un message d'erreur.
 */
export async function requireAdmin(): Promise<{ error: string | null; userId: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié", userId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Accès refusé", userId: null };
  return { error: null, userId: user.id };
}

/**
 * Vérifie que l'utilisateur courant est le manager de l'équipe donnée.
 */
export async function verifyTeamOwnership(
  teamId: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("manager_id", user.id)
    .single();

  if (!team) return { ok: false, error: "Action non autorisée" };
  return { ok: true, error: null };
}
