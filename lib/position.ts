// ── Normalisation des postes joueurs ─────────────────────────
// Le poste est saisi en texte libre (formulaire d'inscription) ou via un
// select aux codes français (GB/DEF/MIL/ATT, espace manager). Ces valeurs ne
// correspondent pas aux codes anglais (GK/DEF/MID/ATT/FWD) qu'un ancien
// regroupement par préfixe attendait, ce qui faisait disparaître gardiens et
// milieux de certains affichages. Toute la catégorisation passe par ici.

export type PositionGroup = "GK" | "DEF" | "MID" | "ATT" | "OTHER";

export const POSITION_GROUP_ORDER: PositionGroup[] = ["GK", "DEF", "MID", "ATT", "OTHER"];

const LABELS: Record<PositionGroup, string> = {
  GK: "Gardien",
  DEF: "Défenseur",
  MID: "Milieu",
  ATT: "Attaquant",
  OTHER: "Autre",
};

const BADGE_CLASSES: Record<PositionGroup, string> = {
  GK: "bg-yellow-400/15 text-yellow-500 border-yellow-400/20",
  DEF: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  MID: "bg-green-500/15 text-green-400 border-green-500/20",
  ATT: "bg-primary/15 text-primary border-primary/20",
  OTHER: "bg-secondary text-muted border-border",
};

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Catégorise un poste saisi librement (GB/DEF/MIL/ATT, mots français complets, codes anglais). */
export function categorizePosition(position: string | null | undefined): PositionGroup {
  if (!position) return "OTHER";
  const key = stripAccents(position.trim().toUpperCase());
  if (key === "GK" || key === "GB" || key.startsWith("GARDIEN") || key.startsWith("GOAL")) return "GK";
  if (key === "DEF" || key === "DF" || key.startsWith("DEFENSEUR") || key.startsWith("DEFENDER")) return "DEF";
  if (key === "MID" || key === "MIL" || key.startsWith("MILIEU") || key.startsWith("MIDFIELD")) return "MID";
  if (key === "ATT" || key === "FWD" || key.startsWith("ATTAQUANT") || key.startsWith("FORWARD")) return "ATT";
  return "OTHER";
}

/** Libellé français à afficher — préserve le texte saisi si le poste n'est pas reconnu. */
export function positionLabel(position: string | null | undefined): string {
  const group = categorizePosition(position);
  if (group === "OTHER" && position) return position;
  return LABELS[group];
}

export function positionBadgeClass(position: string | null | undefined): string {
  return BADGE_CLASSES[categorizePosition(position)];
}

/** Libellé français d'un groupe déjà catégorisé (ex. pour un en-tête de section). */
export function positionGroupLabel(group: PositionGroup): string {
  return LABELS[group];
}

export function positionGroupBadgeClass(group: PositionGroup): string {
  return BADGE_CLASSES[group];
}
