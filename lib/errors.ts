/**
 * lib/errors.ts
 * Traduit les erreurs techniques (Supabase, réseau, JS) en messages
 * compréhensibles en français pour les utilisateurs finaux.
 *
 * Règle : si l'erreur est technique et qu'aucune traduction n'est trouvée,
 * on affiche un message générique + "Contactez l'administration."
 */

/** Traduit une erreur Supabase Auth en message français lisible. */
export function translateAuthError(message: string): string {
  const m = message?.toLowerCase() ?? "";

  if (m.includes("invalid login credentials") || m.includes("invalid_credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Votre email n'a pas encore été confirmé. Vérifiez votre boîte de réception.";
  if (m.includes("user already registered") || m.includes("already exists"))
    return "Un compte existe déjà avec cet email. Connectez-vous ou réinitialisez votre mot de passe.";
  if (m.includes("password should be at least") || m.includes("weak_password"))
    return "Le mot de passe doit contenir au minimum 6 caractères.";
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.";
  if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch"))
    return "Problème de connexion réseau. Vérifiez votre connexion Internet.";
  if (m.includes("jwt expired") || m.includes("session") || m.includes("not authenticated"))
    return "Votre session a expiré. Veuillez vous reconnecter.";
  if (m.includes("signup disabled"))
    return "Les inscriptions sont actuellement désactivées. Contactez l'administration.";
  if (m.includes("email address not authorized"))
    return "Cette adresse email n'est pas autorisée. Contactez l'administration.";

  // Erreur inconnue → message générique + contact admin
  return `Une erreur est survenue lors de la connexion. Contactez l'administration si le problème persiste.`;
}

/** Traduit une erreur Supabase DB / Storage en message français lisible. */
export function translateDbError(message: string): string {
  const m = message?.toLowerCase() ?? "";

  if (m.includes("duplicate") || m.includes("unique") || m.includes("already exists"))
    return "Cette entrée existe déjà (doublon détecté).";
  if (m.includes("foreign key") || m.includes("violates"))
    return "Opération impossible : des données liées existent encore.";
  if (m.includes("not found") || m.includes("no rows"))
    return "L'élément demandé est introuvable.";
  if (m.includes("permission") || m.includes("policy") || m.includes("rls"))
    return "Accès refusé. Vous n'avez pas les droits nécessaires pour cette action.";
  if (m.includes("network") || m.includes("fetch"))
    return "Problème de connexion réseau. Vérifiez votre connexion Internet.";
  if (m.includes("timeout"))
    return "La requête a pris trop de temps. Réessayez dans un moment.";
  if (m.includes("storage") || m.includes("object") || m.includes("bucket"))
    return "Erreur lors du téléchargement du fichier. Vérifiez le format et réessayez.";
  if (m.includes("payload too large") || m.includes("too large"))
    return "Le fichier est trop volumineux. La taille maximale autorisée est 10 Mo.";

  // Erreur technique non traduite
  return `Une erreur technique est survenue. Contactez l'administration si le problème persiste.`;
}

/** Traduit une erreur d'upload Storage en message utilisateur. */
export function translateUploadError(message: string): string {
  const m = message?.toLowerCase() ?? "";

  if (m.includes("already exists") || m.includes("duplicate"))
    return "Ce fichier existe déjà. Il a été remplacé automatiquement.";
  if (m.includes("payload too large") || m.includes("too large") || m.includes("size"))
    return "Fichier trop volumineux. La taille maximale est 10 Mo.";
  if (m.includes("mime") || m.includes("type") || m.includes("format"))
    return "Format de fichier non supporté. Utilisez JPG, PNG, PDF ou ZIP.";
  if (m.includes("not found") || m.includes("bucket"))
    return "Erreur de stockage. Contactez l'administration.";

  return "Erreur lors de l'envoi du fichier. Réessayez ou contactez l'administration.";
}

/** Traduit une erreur JS générique (catch block) en message lisible. */
export function translateGenericError(err: unknown): string {
  if (err instanceof Error) {
    // Si le message est déjà en français (vient de nos propres throws), on le renvoie tel quel
    if (isFrench(err.message)) return err.message;
    return translateDbError(err.message);
  }
  return "Une erreur inattendue est survenue. Contactez l'administration si le problème persiste.";
}

/** Heuristique simple : le message contient-il des mots français courants ? */
function isFrench(msg: string): boolean {
  const frWords = ["équipe", "joueur", "erreur", "introuvable", "autorisé", "requis", "invalide", "impossible", "figé", "contactez", "pris", "déjà", "veuillez"];
  const lower = msg.toLowerCase();
  return frWords.some((w) => lower.includes(w));
}
