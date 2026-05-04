import { PublicNavbar } from "@/components/public/Navbar";
import { Trophy, ArrowUp, ArrowDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export default async function StandingsPage() {
  const supabase = await createClient();
  const { data: standings, error } = await supabase
    .from('standings')
    .select('*, teams(name)')
    .order('points', { ascending: false });

  return (
    <main className="min-h-screen pt-24 pb-12">
      <PublicNavbar />
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                Saison 2026 - Phase de Groupe
              </div>
              <h1 className="text-4xl font-black font-outfit">Classement Officiel</h1>
              <p className="text-muted">Suivez la progression de toutes les équipes en temps réel.</p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              Dernière mise à jour: <span className="text-foreground">Il y a 2h</span>
            </div>
          </div>

          <div className="sports-card bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center w-16">Pos</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Équipe</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">MJ</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">G</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">N</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">P</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">BP</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">BC</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">Diff</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">Pts</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">Forme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(standings || []).map((row: any, index: number) => (
                    <tr key={row.team_id} className={cn(
                      "hover:bg-white/5 transition-colors group",
                      index < 4 && "bg-primary/5"
                    )}>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-black font-outfit text-sm mx-auto",
                          index < 4 ? "bg-accent text-secondary" : "bg-secondary text-muted"
                        )}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                            {row.teams?.name?.[0]}
                          </div>
                          <span className="font-bold text-sm whitespace-nowrap">{row.teams?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium">{row.played}</td>
                      <td className="px-6 py-4 text-center text-sm font-medium">{row.won}</td>
                      <td className="px-6 py-4 text-center text-sm font-medium">{row.drawn}</td>
                      <td className="px-6 py-4 text-center text-sm font-medium">{row.lost}</td>
                      <td className="px-6 py-4 text-center text-sm text-muted">{row.goals_for}</td>
                      <td className="px-6 py-4 text-center text-sm text-muted">{row.goals_against}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold">
                        <span className={cn((row.goals_for - row.goals_against) > 0 ? "text-green-500" : (row.goals_for - row.goals_against) < 0 ? "text-red-500" : "text-muted")}>
                          {(row.goals_for - row.goals_against) > 0 ? `+${row.goals_for - row.goals_against}` : row.goals_for - row.goals_against}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-black font-outfit text-accent">{row.points}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <FormIcon result="W" />
                          <FormIcon result="D" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/5 flex flex-wrap gap-6 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Qualification Phase Finale</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FormIcon({ result }: { result: string }) {
  if (result === 'W') return <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center text-[10px] font-black text-white" title="Victoire">V</div>;
  if (result === 'L') return <div className="w-5 h-5 rounded-md bg-red-500 flex items-center justify-center text-[10px] font-black text-white" title="Défaite">D</div>;
  return <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-[10px] font-black text-white" title="Nul">N</div>;
}
