import { PublicNavbar } from "@/components/public/Navbar";
import { Calendar, Activity, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PublicMatchesPage() {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
    .order('match_date', { ascending: true });

  // Group by date (Sofascore style)
  const groupedMatches = (matches || []).reduce((acc: any, match: any) => {
    // Capitalize first letter of weekday
    const dateObj = new Date(match.match_date);
    let dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(match);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30 pt-24 pb-32">
      <PublicNavbar />
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black font-outfit uppercase tracking-tight">Calendrier & Résultats</h1>
              <p className="text-muted text-sm mt-1">Tous les matchs de la Coupe Cantonale Fieng Okano.</p>
            </div>
          </div>

          <div className="space-y-8">
            {Object.keys(groupedMatches).map((dateStr, i) => (
              <div key={i} className="space-y-3">
                {/* DATE HEADER SOFASCORE STYLE */}
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest">{dateStr}</h3>
                </div>

                {/* MATCHES LIST */}
                <div className="glass-card rounded-xl overflow-hidden border-white/5 divide-y divide-white/5">
                  {groupedMatches[dateStr].map((match: any) => {
                    const isLive = match.status === 'live';
                    const isFinished = match.status === 'finished';
                    const time = new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <Link 
                        href={`/matches/${match.id}`} 
                        key={match.id}
                        className="block hover:bg-white/5 transition-colors group relative"
                      >
                        {isLive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                        
                        <div className="p-4 flex items-center gap-4 sm:gap-8">
                          {/* TIME OR STATUS (LEFT COL) */}
                          <div className={cn(
                            "w-12 text-center text-xs font-black uppercase tracking-widest border-r border-white/5 pr-4 sm:pr-8",
                            isLive ? "text-primary animate-pulse" : isFinished ? "text-muted" : "text-white/60"
                          )}>
                            {isLive ? 'Live' : isFinished ? 'Fin' : time}
                          </div>

                          {/* TEAMS AND SCORES (MAIN COL) */}
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex-1 space-y-3">
                              {/* HOME */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black">
                                    {match.home?.name?.[0]}
                                  </div>
                                  <span className={cn(
                                    "font-bold text-sm tracking-tight",
                                    isFinished && match.home_score > match.away_score ? "text-white" : "text-white/80"
                                  )}>
                                    {match.home?.name}
                                  </span>
                                </div>
                                <span className={cn(
                                  "font-black font-outfit text-lg tabular-nums",
                                  isLive ? "text-primary" : "text-white/90"
                                )}>
                                  {match.status === 'scheduled' ? '-' : match.home_score}
                                </span>
                              </div>

                              {/* AWAY */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black">
                                    {match.away?.name?.[0]}
                                  </div>
                                  <span className={cn(
                                    "font-bold text-sm tracking-tight",
                                    isFinished && match.away_score > match.home_score ? "text-white" : "text-white/80"
                                  )}>
                                    {match.away?.name}
                                  </span>
                                </div>
                                <span className={cn(
                                  "font-black font-outfit text-lg tabular-nums",
                                  isLive ? "text-primary" : "text-white/90"
                                )}>
                                  {match.status === 'scheduled' ? '-' : match.away_score}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ACTION ARROW (RIGHT COL) */}
                          <div className="pl-4 border-l border-white/5 opacity-30 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {Object.keys(groupedMatches).length === 0 && (
              <div className="text-center py-20 glass-card">
                <Activity className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted font-bold">Aucun match disponible pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
