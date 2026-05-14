import { PublicNavbar } from "@/components/public/Navbar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { PublicFooter } from "@/components/public/Footer";

export default async function StandingsPage() {
  const supabase = await createClient();

  const [standingsResult, matchesResult, configResult] = await Promise.all([
    supabase
      .from('standings')
      .select('*, teams(name)')
      .order('position', { ascending: true })
      .order('points', { ascending: false })      // fallback if position not yet set
      .order('goal_diff', { ascending: false })
      .order('goals_for', { ascending: false }),
    supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score, match_date')
      .eq('status', 'finished')
      .order('match_date', { ascending: false }),
    supabase
      .from('tournament_config')
      .select('qualification_spots, points_win, points_draw, points_loss')
      .single(),
  ]);

  const standings = standingsResult.data || [];
  const finishedMatches = matchesResult.data || [];
  const qualificationSpots = configResult.data?.qualification_spots ?? 4;
  const pointsWin  = configResult.data?.points_win  ?? 3;
  const pointsDraw = configResult.data?.points_draw ?? 1;

  // Compute recent form (last 5 results) per team
  const teamForm: Record<string, string[]> = {};
  for (const match of finishedMatches) {
    if (!teamForm[match.home_team_id]) teamForm[match.home_team_id] = [];
    if (!teamForm[match.away_team_id]) teamForm[match.away_team_id] = [];

    if (teamForm[match.home_team_id].length < 5) {
      teamForm[match.home_team_id].push(
        match.home_score > match.away_score ? 'W' : match.home_score < match.away_score ? 'L' : 'D'
      );
    }
    if (teamForm[match.away_team_id].length < 5) {
      teamForm[match.away_team_id].push(
        match.away_score > match.home_score ? 'W' : match.away_score < match.home_score ? 'L' : 'D'
      );
    }
  }

  return (
    <main className="min-h-screen pt-24 pb-12">
      <PublicNavbar />

      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                Saison 2026 — Phase de Groupe
              </div>
              <h1 className="text-4xl font-black font-outfit">Classement Officiel</h1>
              <p className="text-muted">Suivez la progression de toutes les équipes en temps réel.</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              Mis à jour après chaque match
            </div>
          </div>

          {/* Scoring legend */}
          <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">Victoire = {pointsWin} pts</span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">Nul = {pointsDraw} pts</span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">Défaite = 0 pt</span>
          </div>

          <div className="sports-card bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center w-14">Pos</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Équipe</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center" title="Matchs joués">MJ</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center" title="Victoires">G</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center" title="Nuls">N</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center" title="Défaites">P</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center" title="Buts pour">BP</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center" title="Buts contre">BC</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center" title="Différence de buts">Diff</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center" title="Points">Pts</th>
                    <th className="hidden sm:table-cell px-4 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">Forme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {standings.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-16 text-center text-muted italic text-sm">
                        Aucune donnée de classement disponible.
                      </td>
                    </tr>
                  ) : standings.map((row: any, index: number) => {
                    const diff = row.goal_diff ?? (row.goals_for - row.goals_against);
                    const rank = row.position ?? index + 1;
                    const isQualified = rank <= qualificationSpots;
                    return (
                      <tr key={row.team_id} className={cn(
                        "hover:bg-white/5 transition-colors group",
                        isQualified && "bg-primary/5"
                      )}>
                        <td className="px-4 md:px-6 py-4">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-black font-outfit text-sm mx-auto",
                            isQualified ? "bg-accent text-secondary" : "bg-secondary text-muted"
                          )}>
                            {rank}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs shrink-0">
                              {row.teams?.name?.[0]}
                            </div>
                            <span className="font-bold text-sm whitespace-nowrap">{row.teams?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-center text-sm font-medium">{row.played}</td>
                        <td className="px-4 md:px-6 py-4 text-center text-sm font-medium">{row.won}</td>
                        <td className="px-4 md:px-6 py-4 text-center text-sm font-medium">{row.drawn}</td>
                        <td className="px-4 md:px-6 py-4 text-center text-sm font-medium">{row.lost}</td>
                        <td className="px-4 md:px-6 py-4 text-center text-sm text-muted">{row.goals_for}</td>
                        <td className="px-4 md:px-6 py-4 text-center text-sm text-muted">{row.goals_against}</td>
                        <td className="px-4 md:px-6 py-4 text-center text-sm font-bold">
                          <span className={cn(
                            diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-muted"
                          )}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-center">
                          <span className="text-lg font-black font-outfit text-accent">{row.points}</span>
                        </td>
                        <td className="hidden sm:table-cell px-4 md:px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {(teamForm[row.team_id] || []).length > 0
                              ? (teamForm[row.team_id] || []).map((r, i) => <FormIcon key={i} result={r} />)
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

            <div className="p-4 bg-white/5 border-t border-white/5 flex flex-wrap gap-6 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Top {qualificationSpots} — Qualification Phase Finale
                </span>
              </div>
              <div className="flex items-center gap-3 ml-auto text-[10px] text-muted font-bold uppercase tracking-widest">
                <span>Départage : Diff. buts → Buts marqués → Alphabétique</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}

function FormIcon({ result }: { result: string }) {
  if (result === 'W') return <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center text-[10px] font-black text-white" title="Victoire">V</div>;
  if (result === 'L') return <div className="w-5 h-5 rounded-md bg-red-500 flex items-center justify-center text-[10px] font-black text-white" title="Défaite">D</div>;
  return <div className="w-5 h-5 rounded-md bg-muted/40 flex items-center justify-center text-[10px] font-black text-white" title="Nul">N</div>;
}
