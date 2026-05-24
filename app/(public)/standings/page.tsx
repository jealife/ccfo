import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function StandingsPage() {
  const supabase = await createClient();

  const [standingsResult, matchesResult, configResult] = await Promise.all([
    supabase
      .from("standings")
      .select("*, teams(name)")
      .order("position", { ascending: true })
      .order("points",   { ascending: false })
      .order("goal_diff",  { ascending: false })
      .order("goals_for",  { ascending: false }),
    supabase
      .from("matches")
      .select("home_team_id, away_team_id, home_score, away_score, match_date")
      .eq("status", "finished")
      .order("match_date", { ascending: false }),
    supabase
      .from("tournament_config")
      .select("qualification_spots, points_win, points_draw, points_loss")
      .single(),
  ]);

  const standings         = standingsResult.data || [];
  const finishedMatches   = matchesResult.data   || [];
  const qualificationSpots = configResult.data?.qualification_spots ?? 4;
  const pointsWin          = configResult.data?.points_win          ?? 3;
  const pointsDraw         = configResult.data?.points_draw         ?? 1;

  // Forme des 5 derniers matchs par équipe
  const teamForm: Record<string, string[]> = {};
  for (const match of finishedMatches) {
    if (!teamForm[match.home_team_id]) teamForm[match.home_team_id] = [];
    if (!teamForm[match.away_team_id]) teamForm[match.away_team_id] = [];

    if (teamForm[match.home_team_id].length < 5) {
      teamForm[match.home_team_id].push(
        match.home_score > match.away_score ? "W" : match.home_score < match.away_score ? "L" : "D"
      );
    }
    if (teamForm[match.away_team_id].length < 5) {
      teamForm[match.away_team_id].push(
        match.away_score > match.home_score ? "W" : match.away_score < match.home_score ? "L" : "D"
      );
    }
  }

  return (
    <main className="bg-background pt-24 pb-24 lg:pb-0">

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8 lg:pb-16">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                Saison 2026 — Phase de Groupe
              </div>
              <h1 className="text-3xl md:text-4xl font-black font-outfit uppercase tracking-tighter text-foreground">
                Classement Officiel
              </h1>
              <p className="text-muted text-sm mt-1">
                Suivez la progression de toutes les équipes en temps réel.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted bg-secondary px-4 py-2 rounded-xl border border-border shrink-0">
              Mis à jour après chaque match
            </div>
          </div>

          {/* Règles de points */}
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
            <span className="px-3 py-1.5 rounded-full bg-secondary border border-border">Victoire = {pointsWin} pts</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary border border-border">Nul = {pointsDraw} pts</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary border border-border">Défaite = 0 pt</span>
          </div>

          {/* Tableau */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary border-b border-border">
                  <tr>
                    <th className="px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center w-14">Pos</th>
                    <th className="px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted">Équipe</th>
                    <th className="px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center" title="Matchs joués">MJ</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center" title="Victoires">G</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center" title="Nuls">N</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center" title="Défaites">P</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center" title="Buts pour">BP</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center" title="Buts contre">BC</th>
                    <th className="px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center" title="Différence de buts">Diff</th>
                    <th className="px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center" title="Points">Pts</th>
                    <th className="hidden sm:table-cell px-4 md:px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted text-center">Forme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {standings.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-16 text-center text-muted italic text-sm">
                        Aucune donnée de classement disponible.
                      </td>
                    </tr>
                  ) : standings.map((row: any, index: number) => {
                    const diff  = row.goal_diff ?? (row.goals_for - row.goals_against);
                    const rank  = row.position  ?? index + 1;
                    const isQualified = rank <= qualificationSpots;

                    return (
                      <tr
                        key={row.team_id}
                        className={cn(
                          "hover:bg-secondary/60 transition-colors group",
                          isQualified && "bg-primary/2.5"
                        )}
                      >
                        <td className={cn(
                          "px-4 md:px-6 py-4 border-l-2",
                          isQualified ? "border-primary" : "border-transparent"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-black font-outfit text-sm mx-auto",
                            isQualified
                              ? "bg-primary text-white shadow-md shadow-primary/25"
                              : "bg-secondary text-muted"
                          )}>
                            {rank}
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs shrink-0 text-foreground">
                              {(row.teams as any)?.name?.[0]}
                            </div>
                            <span className="font-bold text-sm text-foreground whitespace-nowrap">
                              {(row.teams as any)?.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-4 text-center text-sm font-medium text-foreground">{row.played ?? 0}</td>
                        <td className="hidden md:table-cell px-4 md:px-6 py-4 text-center text-sm font-medium text-foreground">{row.won ?? 0}</td>
                        <td className="hidden md:table-cell px-4 md:px-6 py-4 text-center text-sm font-medium text-foreground">{row.drawn ?? 0}</td>
                        <td className="hidden md:table-cell px-4 md:px-6 py-4 text-center text-sm font-medium text-foreground">{row.lost ?? 0}</td>
                        <td className="hidden md:table-cell px-4 md:px-6 py-4 text-center text-sm text-muted">{row.goals_for ?? 0}</td>
                        <td className="hidden md:table-cell px-4 md:px-6 py-4 text-center text-sm text-muted">{row.goals_against ?? 0}</td>

                        <td className="px-4 md:px-6 py-4 text-center text-sm font-bold">
                          <span className={cn(
                            diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-muted"
                          )}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>

                        <td className="px-4 md:px-6 py-4 text-center">
                          <span className="text-lg font-black font-outfit text-primary">{row.points}</span>
                        </td>

                        <td className="hidden sm:table-cell px-4 md:px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {(teamForm[row.team_id] || []).length > 0
                              ? (teamForm[row.team_id] || []).map((r, i) => <FormBadge key={i} result={r} />)
                              : <span className="text-[9px] text-muted">—</span>
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Légende */}
            <div className="p-4 bg-secondary border-t border-border flex flex-wrap gap-4 justify-center md:justify-start items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Top {qualificationSpots} — Qualification Phase Finale
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted font-bold uppercase tracking-widest md:ml-auto">
                <span>Départage : Diff. buts → Buts marqués → Alphabétique</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

function FormBadge({ result }: { result: string }) {
  if (result === "W") {
    return (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[9px] font-black text-white" title="Victoire">
        V
      </div>
    );
  }
  if (result === "L") {
    return (
      <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center text-[9px] font-black text-white" title="Défaite">
        D
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-border flex items-center justify-center text-[9px] font-black text-muted" title="Nul">
      N
    </div>
  );
}
