// ── Constantes partagées ─────────────────────────────────────

/** Frais d'affiliation d'une équipe (FCFA) */
export const REGISTRATION_FEE = 400_000;

/**
 * URL publique du site (metadata, sitemap, JSON-LD).
 * Priorité : variable d'env NEXT_PUBLIC_SITE_URL (surchargeable par
 * environnement Vercel sans rebuild) → valeur de production par défaut.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.coupecantonalefiengokano.ga";

/**
 * Numéro Mobile Money pour le paiement des frais d'affiliation.
 * Configurable via NEXT_PUBLIC_MOBILE_MONEY_NUMBER dans .env / Vercel.
 */
export const MOBILE_MONEY_NUMBER =
  process.env.NEXT_PUBLIC_MOBILE_MONEY_NUMBER ?? "+241 00000000";
