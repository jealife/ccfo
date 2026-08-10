// ── Fuseau horaire du tournoi ────────────────────────────────
// Le CCFO se joue exclusivement à Fieng Okano (Gabon), en WAT (UTC+1,
// sans heure d'été). On fixe ce fuseau explicitement partout où une heure
// de match est saisie ou affichée, plutôt que de dépendre du fuseau du
// navigateur/serveur qui exécute le code (source du bug de décalage d'1h).

export const TOURNAMENT_TIMEZONE = "Africa/Libreville";
const TOURNAMENT_UTC_OFFSET = "+01:00";

/**
 * Convertit la valeur d'un <input type="datetime-local"> (ex. "2026-08-10T15:30",
 * une heure "naïve" que l'admin saisit en heure de Fieng Okano) en instant UTC
 * non-ambigu, prêt à être stocké en base (colonne timestamptz).
 */
export function localInputToISOString(value: string): string {
  return `${value}:00${TOURNAMENT_UTC_OFFSET}`;
}

/**
 * Convertit un timestamp stocké (ISO, UTC) en valeur pour <input type="datetime-local">,
 * exprimée en heure de Fieng Okano — indépendamment du fuseau du navigateur.
 */
export function isoToLocalInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOURNAMENT_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
