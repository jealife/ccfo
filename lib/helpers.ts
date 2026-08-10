// ── Helpers partagés ─────────────────────────────────────────

import { TOURNAMENT_TIMEZONE } from "./timezone";

const TEAM_PALETTES = [
  { bg: "bg-red-500/20",     border: "border-red-400/30",     text: "text-red-400"     },
  { bg: "bg-blue-500/20",    border: "border-blue-400/30",    text: "text-blue-400"    },
  { bg: "bg-emerald-500/20", border: "border-emerald-400/30", text: "text-emerald-400" },
  { bg: "bg-violet-500/20",  border: "border-violet-400/30",  text: "text-violet-400"  },
  { bg: "bg-orange-500/20",  border: "border-orange-400/30",  text: "text-orange-400"  },
  { bg: "bg-amber-500/20",   border: "border-amber-400/30",   text: "text-amber-400"   },
  { bg: "bg-pink-500/20",    border: "border-pink-400/30",    text: "text-pink-400"    },
  { bg: "bg-cyan-500/20",    border: "border-cyan-400/30",    text: "text-cyan-400"    },
  { bg: "bg-teal-500/20",    border: "border-teal-400/30",    text: "text-teal-400"    },
  { bg: "bg-indigo-500/20",  border: "border-indigo-400/30",  text: "text-indigo-400"  },
] as const;

/** Retourne une palette de couleur déterministe à partir du nom d'équipe */
export function getTeamPalette(name: string | undefined | null) {
  if (!name) return TEAM_PALETTES[0];
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TEAM_PALETTES[code % TEAM_PALETTES.length];
}

/** Extrait la valeur started_at depuis le tableau stats d'un match */
export function getStartedAt(stats: unknown[] | null | undefined): string | null {
  if (!Array.isArray(stats)) return null;
  return (stats as Array<{ label: string; value?: string }>)
    .find((s) => s.label === "started_at")?.value ?? null;
}

/** Formate une date en français, toujours en heure de Fieng Okano (WAT) */
export function formatFrenchDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
): string {
  return new Date(date).toLocaleDateString("fr-FR", { ...options, timeZone: TOURNAMENT_TIMEZONE });
}

/** Formate une heure en français (HH:MM), toujours en heure de Fieng Okano (WAT) */
export function formatFrenchTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TOURNAMENT_TIMEZONE });
}

/** Libellé français d'un statut de match */
export function formatMatchStatus(status: string): string {
  const labels: Record<string, string> = {
    scheduled: "Programmé",
    live:      "En direct",
    finished:  "Terminé",
  };
  return labels[status] ?? status;
}

/**
 * Numéro de reçu officiel des frais d'affiliation.
 * Déterministe : dérivé de l'id du paiement, donc identique côté manager et admin.
 */
export function formatReceiptNumber(paymentId: string, createdAt?: string | null): string {
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  const suffix = paymentId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `CCFO${String(year).slice(-2)}-${suffix}`;
}

/** Phases de groupe (matchs comptant pour le classement) */
export const GROUP_PHASES = ["Groupe A", "Groupe B"] as const;

/** Retourne true si la phase est une phase de groupe */
export function isGroupPhase(groupName: string | null | undefined): boolean {
  return !!groupName && (GROUP_PHASES as readonly string[]).includes(groupName);
}
