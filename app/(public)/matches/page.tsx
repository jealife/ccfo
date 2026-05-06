import { PublicNavbar } from "@/components/public/Navbar";
import { Calendar, Activity, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PublicMatchesPage() {
  const supabase = createAdminClient();
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
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">Calendrier & Résultats</h1>
              <p className="text-muted text-xs mt-1">L'élite du canton Fieng Okano en direct.</p>
            </div>
            
            {/* QUICK FILTERS - MOBILE FIRST */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['Tous', 'Live', 'Terminés', 'À venir'].map((f) => (
                <button key={f} className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                  f === 'Tous' ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 text-muted hover:text-white"
                )}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            {Object.keys(groupedMatches).map((dateStr, i) => (
              <div key={i} className="space-y-4">
                {/* DATE HEADER - SLEEK PILLED DESIGN */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent md:to-white/10" />
                  <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-white/60">{dateStr}</h3>
                  </div>
                  <div className="h-px flex-1 bg-linear-to-l from-transparent via-white/10 to-transparent md:to-white/10 hidden md:block" />
                </div>

                {/* MATCHES LIST - ELITE CARDS */}
                <div className="grid grid-cols-1 gap-3">
                  {groupedMatches[dateStr].map((match: any) => {
                    const isLive = match.status === 'live';
                    const isFinished = match.status === 'finished';
                    const time = new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <Link 
                        href={`/matches/${match.id}`} 
                        key={match.id}
                        className="group relative"
                      >
                        <div className={cn(
                          "sports-card p-5 flex items-center justify-between gap-2 md:gap-8 hover:border-primary/30 transition-all duration-500",
                          isLive && "border-primary/20 bg-primary/5 shadow-2xl shadow-primary/10"
                        )}>
                          {/* TIME/STATUS */}
                          <div className="w-10 md:w-16 flex flex-col items-center gap-1 shrink-0 border-r border-white/5 pr-2 md:pr-4">
                            <span className={cn(
                              "text-[10px] md:text-xs font-black font-outfit uppercase tracking-tighter",
                              isLive ? "text-primary animate-pulse" : "text-white/60"
                            )}>
                              {isLive ? 'LIVE' : isFinished ? 'FIN' : time}
                            </span>
                            {isLive && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />}
                          </div>

                          {/* TEAM DOMICILE */}
                          <div className="flex-1 flex flex-row md:flex-row-reverse items-center justify-end gap-3 md:gap-5">
                            <span className="hidden md:block text-sm font-bold uppercase tracking-tight text-white/80 group-hover:text-white transition-colors truncate">
                              {match.home?.name}
                            </span>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary border border-white/10 flex items-center justify-center text-sm md:text-xl font-black shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0">
                              {match.home?.name?.[0]}
                            </div>
                          </div>

                          {/* SCORE CENTRAL */}
                          <div className="px-4 py-2 rounded-2xl bg-background/50 border border-white/5 flex items-center gap-2 md:gap-4 shrink-0 min-w-[70px] md:min-w-[120px] justify-center shadow-inner">
                            <span className={cn(
                              "text-xl md:text-4xl font-black font-outfit tabular-nums tracking-tighter",
                              isLive ? "text-primary" : isFinished ? "text-white" : "text-white/20"
                            )}>
                              {match.status === 'scheduled' ? '-' : match.home_score}
                            </span>
                            <div className="w-px h-4 bg-white/10" />
                            <span className={cn(
                              "text-xl md:text-4xl font-black font-outfit tabular-nums tracking-tighter",
                              isLive ? "text-primary" : isFinished ? "text-white" : "text-white/20"
                            )}>
                              {match.status === 'scheduled' ? '-' : match.away_score}
                            </span>
                          </div>

                          {/* TEAM EXTERIEUR */}
                          <div className="flex-1 flex items-center justify-start gap-3 md:gap-5 text-right">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary border border-white/10 flex items-center justify-center text-sm md:text-xl font-black shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0">
                              {match.away?.name?.[0]}
                            </div>
                            <span className="hidden md:block text-sm font-bold uppercase tracking-tight text-white/80 group-hover:text-white transition-colors truncate">
                              {match.away?.name}
                            </span>
                          </div>

                          {/* ACTION - HIDDEN ON MOBILE FOR CLEANER LOOK */}
                          <div className="hidden md:flex pl-4 border-l border-white/5 opacity-20 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5 text-primary" />
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
