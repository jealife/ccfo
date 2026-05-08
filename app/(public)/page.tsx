import { PublicNavbar } from "@/components/public/Navbar";
import { Trophy, Calendar, Users, BarChart3, Star, Zap, Award, ChevronRight, Activity, MapPin, TrendingUp, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { LiveHeroMatch } from "@/components/public/LiveHeroMatch";
import { PublicFooter } from "@/components/public/Footer";

export default async function HomePage() {
  const supabase = createAdminClient();
  
  // Fetch Latest Results (Matchs terminés ou en cours)
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
    .in('status', ['finished', 'live'])
    .order('match_date', { ascending: false })
    .limit(5);

  // Fetch Live or Next Upcoming Match (Priorité au Direct, puis au prochain)
  const { data: nextMatch } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
    .in('status', ['live', 'scheduled'])
    .order('status', { ascending: false }) // 'live' is alphabetically after 'pending'? No, 'live' < 'pending' alphabetically. 
    // Actually better to do two queries or order by custom logic.
    // Let's use a simpler logic: fetch live, if null fetch pending.
    .order('match_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  const heroMatch = nextMatch || matches?.[0];

  // Fetch Standings
  const { data: standings } = await supabase
    .from('standings')
    .select('*, teams(name)')
    .order('points', { ascending: false })
    .limit(5);

  // Fetch Tournament Config
  const { data: config } = await supabase
    .from('tournament_config')
    .select('*')
    .single();

  const tournamentName = config?.name || "Coupe Cantonale Fieng Okano";
  const tournamentYear = config?.start_date ? new Date(config.start_date).getFullYear() : 2026;

  // Split name for styling (assuming "Coupe Cantonale Fieng Okano")
  const nameParts = tournamentName.split(' ');
  const mainName = nameParts.slice(0, 2).join(' '); // "Coupe Cantonale"
  const subName = nameParts.slice(2).join(' '); // "Fieng Okano 2026"

  // --- DYNAMISATION DES BUTEURS ---
  const allEvents = (matches || []).flatMap(m => m.events || []);
  const goals = allEvents.filter(e => e.type === 'goal');
  const goalCounts = goals.reduce((acc: any, g: any) => {
    acc[g.player] = (acc[g.player] || 0) + 1;
    return acc;
  }, {});

  const topScorerNames = Object.entries(goalCounts)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3);

  const { data: playerData } = await supabase
    .from('players')
    .select('full_name, photo_url, team:teams(name)')
    .in('full_name', topScorerNames.map(([name]) => name));

  const topScorers = topScorerNames.map(([name, goals], index) => {
    const info = (playerData as any[])?.find(p => p.full_name === name);
    return {
      name,
      goals: goals as number,
      rank: index + 1,
      team: info?.team?.name || "CCFO",
      photo: info?.photo_url
    };
  });

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      <PublicNavbar />
      
      {/* --- HERO SECTION: ELITE VISUALS --- */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 md:pt-10 md:pb-10 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/image-1.jpg" 
            alt="Stadium Atmosphere" 
            fill 
            className="object-cover opacity-50 animate-slow-zoom scale-110"
            priority
          />
          {/* Advanced Overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(239,68,68,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-linear-to-b from-background/10 via-background/60 to-background" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/20 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-6 md:space-y-10">
              <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-fade-in">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[7px] md:text-[8px] font-black">
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-[9px] md:text-xs font-black uppercase tracking-widest text-white/80">Edition 2026 • Prestige</p>
              </div>

              <div className="space-y-4 md:space-y-6">
                <h1 className="text-3xl md:text-6xl lg:text7xl font-black font-outfit uppercase tracking-tighter leading-[0.9] text-white">
                  <span className="block opacity-60">Coupe Cantonale</span>
                  <span className="block text-primary italic drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">Fieng Okano</span>
                  <span className="block">2026</span>
                </h1>
                
                <p className="text-xs md:text-xl text-muted font-medium max-w-xl leading-relaxed">
                  Vivez l'excellence du football au cœur du canton Fieng Okano 2026. L'élite s'affronte, l'histoire s'écrit ici.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-6 animate-slide-up animation-delay-400">
                <Link href="/register" className="btn-primary group">
                  Inscrire mon équipe
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/matches" className="btn-glass group">
                  Calendrier Officiel
                  <Calendar className="w-4 h-4 text-primary" />
                </Link>
              </div>
            </div>

            {/* HERO FEATURE CARD - REALTIME */}
            <div className="lg:col-span-5 hidden lg:block animate-fade-in animation-delay-600">
              <LiveHeroMatch initialMatch={heroMatch} />
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTENT GRID: SOFASCORE EVOLUTION --- */}
      <section className="container mx-auto px-4 -mt-24 relative z-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* MAIN COLUMN: MATCHES & ACTION */}
          <div className="lg:col-span-8 space-y-10">
            <SectionHeader title="Derniers Résultats" icon={<Zap className="text-primary" />} href="/matches" />
            
            <div className="space-y-4">
              {(matches || []).map((match: any) => (
                <Link 
                  href={`/matches/${match.id}`}
                  key={match.id} 
                  className="sports-card p-4 md:p-6 flex items-center justify-between group cursor-pointer overflow-hidden gap-3 md:gap-10 transition-all duration-500 hover:border-primary/30 shadow-lg shadow-black/20"
                >
                  {/* Glowing line overlay */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-all" />
                  
                  <div className="flex items-center gap-3 md:gap-10 flex-1 min-w-0">
                    {/* Date/Status Info */}
                    <div className="flex flex-col items-center justify-center gap-1 min-w-[50px] md:min-w-[80px] border-r border-white/5 pr-3 md:pr-10 shrink-0">
                      <span className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{new Date(match.match_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest",
                        match.status === 'live' ? "bg-primary/20 text-primary animate-pulse" : "bg-white/5 text-muted"
                      )}>
                        {match.status === 'live' ? 'Live' : match.status === 'finished' ? 'Fin' : 'À ven'}
                      </div>
                    </div>
                    
                    {/* Scoreboard Style Layout */}
                    <div className="flex-1 flex items-center justify-between gap-2 md:gap-10 min-w-0">
                      {/* HOME */}
                      <div className="flex-1 flex items-center justify-end gap-2 md:gap-5 min-w-0">
                        <span className="font-bold text-[10px] md:text-sm text-right uppercase tracking-tight text-white/80 group-hover:text-white truncate hidden sm:block">{match.home?.name}</span>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-secondary border border-white/5 flex items-center justify-center font-black text-xs md:text-sm shadow-xl group-hover:scale-110 transition-transform shrink-0">
                          {match.home?.name?.[0]}
                        </div>
                      </div>

                      {/* SCORE BOX */}
                      <div className="bg-background/50 px-3 md:px-5 py-1.5 md:py-2 rounded-2xl border border-white/5 flex items-center gap-2 md:gap-4 shrink-0 shadow-inner">
                        <span className="text-xl md:text-3xl font-black font-outfit tabular-nums tracking-tighter text-white">
                          {match.status === 'scheduled' ? '-' : match.home_score}
                        </span>
                        <div className="w-px h-4 bg-white/10" />
                        <span className="text-xl md:text-3xl font-black font-outfit tabular-nums tracking-tighter text-white">
                          {match.status === 'scheduled' ? '-' : match.away_score}
                        </span>
                      </div>

                      {/* AWAY */}
                      <div className="flex-1 flex items-center justify-start gap-2 md:gap-5 min-w-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-secondary border border-white/5 flex items-center justify-center font-black text-xs md:text-sm shadow-xl group-hover:scale-110 transition-transform shrink-0">
                          {match.away?.name?.[0]}
                        </div>
                        <span className="font-bold text-[10px] md:text-sm text-left uppercase tracking-tight text-white/80 group-hover:text-white truncate hidden sm:block">{match.away?.name}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* SIDEBAR: RANKINGS & TALENT */}
          <div className="lg:col-span-4 space-y-12">
            {/* COMPACT TABLE */}
            <div className="space-y-6">
              <SectionHeader title="Le Classement" icon={<BarChart3 className="text-accent" />} />
              <div className="glass-card rounded-xl! overflow-hidden border-white/5">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-muted">Pos</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-muted">Club</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-muted text-center">MJ</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-muted text-center">Diff</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-muted text-center">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(standings || []).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-white/3 transition-colors">
                        <td className="p-4">
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black font-outfit",
                            i < 3 ? "bg-accent/10 text-accent" : "bg-white/5 text-muted"
                          )}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-xs uppercase tracking-tight">{(row.teams as any)?.name}</td>
                        <td className="p-4 font-black font-outfit text-center text-white/40 text-[10px]">{row.played || 0}</td>
                        <td className="p-4 font-black font-outfit text-center text-white/40 text-[10px]">{row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff || 0}</td>
                        <td className="p-4 font-black font-outfit text-center text-accent">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TALENT SPOTLIGHT */}
            <div className="space-y-6">
              <SectionHeader title="Meilleurs Buteurs" icon={<Award className="text-primary" />} />
              <div className="space-y-4">
                {topScorers.map((player, i) => (
                  <div key={i} className="glass-card rounded-2xl! p-4 flex items-center justify-between group hover:border-primary/30 transition-all duration-500">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-lg border border-white/5 overflow-hidden">
                          {player.photo ? (
                            <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            player.name[0]
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-white border-4 border-background shadow-lg">
                          {player.rank}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight">{player.name}</div>
                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{player.team}</div>
                      </div>
                    </div>
                    <div className="text-right pr-2">
                      <div className="text-2xl font-black font-outfit text-white group-hover:text-primary transition-colors">{player.goals}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted">Goals</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

function SectionHeader({ title, icon, href }: { title: string; icon: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-center justify-between px-2">
      <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
          {icon}
        </div>
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors flex items-center gap-2">
          Tout voir <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function TeamEmblem({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-2xl relative group-hover:scale-105 transition-transform duration-500">
        <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all" />
        <span className="relative z-10">{label}</span>
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{name}</div>
    </div>
  );
}
