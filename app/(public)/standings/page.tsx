import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/server";
import { Trophy, Swords } from "lucide-react";
import type { Standing, Match } from "@/lib/types";
import { TOURNAMENT_TIMEZONE } from "@/lib/timezone";

export const metadata: Metadata = {
  title: "Classement Officiel",
  description: "Classement officiel de la Coupe Cantonale Fieng Okano 2026 — points, différence de buts, forme des équipes et phase finale.",
  openGraph: {
    title: "Classement Officiel — CCFO26",
    description: "Suivez le classement en temps réel de la Coupe Cantonale Fieng Okano 2026, phase de groupes et phase finale.",
    images: [{ url: "/image-1.jpg", width: 1200, height: 630, alt: "CCFO26 Classement" }],
  },
};

export const revalidate = 60;

export default async function StandingsPage() {
  const supabase = createAdminClient();

  const [standingsResult, matchesResult, knockoutResult, configResult] = await Promise.all([
    supabase
      .from("standings")
      .select("*, teams(name)")
      .order("group_name", { ascending: true })
      .order("position",   { ascending: true }),
    supabase
      .from("matches")
      .select("home_team_id, away_team_id, home_score, away_score, match_date, group_name")
      .in("group_name", ["Groupe A", "Groupe B"])
      .eq("status", "finished")
      .order("match_date", { ascending: false }),
    supabase
      .from("matches")
      .select("id, status, match_date, home_score, away_score, group_name, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)")
      .in("group_name", ["Demi-finale 1", "Demi-finale 2", "Petite Finale", "Grande Finale"])
      .order("match_date", { ascending: true }),
    supabase
      .from("tournament_config")
      .select("points_win, points_draw, points_loss")
      .single(),
  ]);

  const allStandings    = standingsResult.data || [];
  const groupMatches    = matchesResult.data   || [];
  const knockoutMatches = knockoutResult.data  || [];
  const pointsWin       = configResult.data?.points_win  ?? 3;
  const pointsDraw      = configResult.data?.points_draw ?? 1;

  const typedStandings = allStandings as Standing[];
  const groupA = typedStandings.filter((r) => r.group_name === "Groupe A");
  const groupB = typedStandings.filter((r) => r.group_name === "Groupe B");

  // Forme (5 derniers matchs de groupe)
  const teamForm: Record<string, string[]> = {};
  for (const match of groupMatches) {
    const hs = match.home_score ?? 0;
    const as_ = match.away_score ?? 0;
    if (!teamForm[match.home_team_id]) teamForm[match.home_team_id] = [];
    if (!teamForm[match.away_team_id]) teamForm[match.away_team_id] = [];
    if (teamForm[match.home_team_id].length < 5)
      teamForm[match.home_team_id].push(hs > as_ ? "W" : hs < as_ ? "L" : "D");
    if (teamForm[match.away_team_id].length < 5)
      teamForm[match.away_team_id].push(as_ > hs ? "W" : as_ < hs ? "L" : "D");
  }

  const typedKnockout = knockoutMatches as unknown as Match[];
  const semifinal1 = typedKnockout.find((m) => m.group_name === "Demi-finale 1");
  const semifinal2 = typedKnockout.find((m) => m.group_name === "Demi-finale 2");
  const thirdPlace = typedKnockout.find((m) => m.group_name === "Petite Finale");
  const final      = typedKnockout.find((m) => m.group_name === "Grande Finale");

  const hasKnockout = semifinal1 || semifinal2 || thirdPlace || final;

  return (
    <main className="bg-background pt-24 pb-24 lg:pb-0">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-10 lg:pb-16">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                Saison 2026 — Phase de Groupe
              </div>
              <h1 className="text-3xl md:text-4xl font-black font-outfit uppercase tracking-tighter text-foreground">
                Classement Officiel
              </h1>
              <p className="text-muted text-sm mt-1">2 poules de 4 équipes, les 2 premiers de chaque poule accèdent aux demi-finales.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-muted shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-secondary border border-border">V = {pointsWin} pts</span>
              <span className="px-3 py-1.5 rounded-full bg-secondary border border-border">N = {pointsDraw} pt</span>
              <span className="px-3 py-1.5 rounded-full bg-secondary border border-border">D = 0 pt</span>
            </div>
          </div>

          {/* Phase de groupes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GroupTable label="Groupe A" rows={groupA} teamForm={teamForm} />
            <GroupTable label="Groupe B" rows={groupB} teamForm={teamForm} />
          </div>

          {/* Légende */}
          <div className="flex flex-wrap gap-4 text-[10px] text-muted font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              Top 2 — Qualification Demi-finales
            </div>
            <div className="flex items-center gap-2 md:ml-auto">
              Départage : Diff. buts → Buts marqués → Alphabétique
            </div>
          </div>

          {/* Phase finale */}
          {hasKnockout && (
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <Swords className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black font-outfit uppercase tracking-tighter text-foreground">Phase Finale</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {semifinal1 && <KnockoutCard match={semifinal1} label="Demi-finale 1" />}
                {semifinal2 && <KnockoutCard match={semifinal2} label="Demi-finale 2" />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {thirdPlace && <KnockoutCard match={thirdPlace} label="Petite Finale" accent="muted" />}
                {final      && <KnockoutCard match={final}      label="Grande Finale" accent="gold" />}
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
}

/* ── Tableau de groupe ── */
function GroupTable({ label, rows, teamForm }: {
  label: string;
  rows: Standing[];
  teamForm: Record<string, string[]>;
}) {
  return (
    <div className="glass-card overflow-hidden">
      {/* En-tête groupe */}
      <div className="px-5 py-3.5 bg-secondary border-b border-border flex items-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-black uppercase tracking-widest text-foreground">{label}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted text-center w-10">#</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted">Équipe</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted text-center cursor-help" title="Matchs Joués">MJ</th>
              <th className="hidden sm:table-cell px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted text-center cursor-help" title="Victoires">V</th>
              <th className="hidden sm:table-cell px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted text-center cursor-help" title="Matchs Nuls">N</th>
              <th className="hidden sm:table-cell px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted text-center cursor-help" title="Défaites">D</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted text-center cursor-help" title="Différence de buts (marqués − encaissés)">+/-</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted text-center">Pts</th>
              <th className="hidden md:table-cell px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted text-center">Forme</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-muted italic text-sm">
                  Aucune donnée disponible.
                </td>
              </tr>
            ) : rows.map((row, index) => {
              const diff = row.goal_diff ?? (row.goals_for - row.goals_against);
              const rank = row.position ?? index + 1;
              const qualifies = rank <= 2;

              return (
                <tr
                  key={row.team_id}
                  className={cn(
                    "transition-colors group hover:bg-secondary/60",
                    qualifies && "bg-primary/[0.025]"
                  )}
                >
                  <td className={cn(
                    "px-4 py-3.5 border-l-2",
                    qualifies ? "border-primary" : "border-transparent"
                  )}>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-black text-xs mx-auto font-outfit",
                      qualifies ? "bg-primary text-white shadow-sm shadow-primary/30" : "bg-secondary text-muted"
                    )}>
                      {rank}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs shrink-0 text-foreground">
                        {row.teams?.name?.[0]}
                      </div>
                      <span className="font-bold text-sm text-foreground whitespace-nowrap">
                        {row.teams?.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-center text-sm font-medium text-foreground">{row.played ?? 0}</td>
                  <td className="hidden sm:table-cell px-4 py-3.5 text-center text-sm font-medium text-foreground">{row.won ?? 0}</td>
                  <td className="hidden sm:table-cell px-4 py-3.5 text-center text-sm font-medium text-foreground">{row.drawn ?? 0}</td>
                  <td className="hidden sm:table-cell px-4 py-3.5 text-center text-sm font-medium text-foreground">{row.lost ?? 0}</td>

                  <td className="px-4 py-3.5 text-center text-sm font-bold">
                    <span className={cn(
                      diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-muted"
                    )}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span className="text-base font-black font-outfit text-primary">{row.points}</span>
                  </td>

                  <td className="hidden md:table-cell px-4 py-3.5">
                    <div className="flex items-center justify-center gap-0.5">
                      {(teamForm[row.team_id] || []).length > 0
                        ? (teamForm[row.team_id] || []).map((r, i) => <FormBadge key={i} result={r} />)
                        : <span className="text-[9px] text-muted">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Carte match phase finale ── */
function KnockoutCard({ match, label, accent = "primary" }: {
  match: Match;
  label: string;
  accent?: "primary" | "gold" | "muted";
}) {
  const isFinished  = match.status === "finished";
  const isLive      = match.status === "live";
  const matchDate   = new Date(match.match_date);

  const accentClass = accent === "gold"
    ? "text-accent border-accent/20 bg-accent/5"
    : accent === "muted"
    ? "text-muted border-border bg-secondary/50"
    : "text-primary border-primary/20 bg-primary/5";

  const labelAccent = accent === "gold" ? "text-accent" : accent === "muted" ? "text-muted" : "text-primary";

  return (
    <div className={cn("glass-card p-5 border", accentClass.split(" ").slice(1).join(" "))}>
      <div className="flex items-center justify-between mb-4">
        <span className={cn("text-[10px] font-black uppercase tracking-widest", labelAccent)}>{label}</span>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
          isLive      ? "bg-primary text-white animate-pulse"
          : isFinished ? "bg-secondary text-muted border border-border"
          : "bg-accent/15 text-accent"
        )}>
          {isLive ? "Live" : isFinished ? "Terminé" : matchDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: TOURNAMENT_TIMEZONE })}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-sm mx-auto mb-1.5">
            {match.home?.name?.[0] ?? "?"}
          </div>
          <span className="text-xs font-bold text-foreground leading-tight block">{match.home?.name ?? "À déterminer"}</span>
        </div>

        <div className="text-center shrink-0 min-w-[60px]">
          {isFinished || isLive ? (
            <span className={cn("text-2xl font-black font-outfit tabular-nums", isLive ? "text-primary" : "text-foreground")}>
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <span className="text-sm font-black text-muted">VS</span>
          )}
        </div>

        <div className="flex-1 text-center">
          <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-sm mx-auto mb-1.5">
            {match.away?.name?.[0] ?? "?"}
          </div>
          <span className="text-xs font-bold text-foreground leading-tight block">{match.away?.name ?? "À déterminer"}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Badge forme ── */
function FormBadge({ result }: { result: string }) {
  if (result === "W") return (
    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-black text-white" title="Victoire">V</div>
  );
  if (result === "L") return (
    <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center text-[8px] font-black text-white" title="Défaite">D</div>
  );
  return (
    <div className="w-4 h-4 rounded-full bg-border flex items-center justify-center text-[8px] font-black text-muted" title="Nul">N</div>
  );
}
