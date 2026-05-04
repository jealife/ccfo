import { PublicNavbar } from "@/components/public/Navbar";
import { Trophy, Calendar, Users, BarChart3, Star, Zap, Award, ChevronRight, Activity, MapPin, TrendingUp, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  
  // Fetch Latest Matches (Derniers résultats)
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
    .order('match_date', { ascending: false })
    .limit(5);

  // Fetch Next Upcoming or Live Match
  const { data: nextMatchData } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
    .in('status', ['pending', 'live'])
    .order('match_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextMatch = nextMatchData || matches?.[0];

  // Fetch Standings
  const { data: standings } = await supabase
    .from('standings')
    .select('*, teams(name)')
    .order('points', { ascending: false })
    .limit(5);

  // Mock Scorers with Gabonese names
  const topScorers = [
    { name: "Samuel Mba", team: "Village Bissobinam", goals: 12, rank: 1 },
    { name: "Brice Ondo", team: "Okano Stars", goals: 9, rank: 2 },
    { name: "Samuel Obame", team: "Elite de l'Ogooué", goals: 7, rank: 3 },
  ];

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      <PublicNavbar />
      
      {/* --- HERO SECTION: ELITE VISUALS --- */}
      <section className="relative h-screen flex items-center pt-10 overflow-hidden">
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
            <div className="lg:col-span-7 space-y-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-fade-in">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[8px] font-black">
                      {i}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Saison 2026 • 8 Villages Engagés</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-6xl md:text-7xl font-outfit font-black leading-[0.9] tracking-tighter animate-slide-up">
                  Coupe Cantonale <br />
                  <span className="gradient-text-primary italic">Fieng Okano</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted/80 max-w-xl font-medium leading-relaxed animate-slide-up animation-delay-200">
                  Vivez l'excellence du football au cœur du canton Fieng Okano. L'élite s'affronte, l'histoire s'écrit ici.
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

            {/* HERO FEATURE CARD */}
            <div className="lg:col-span-5 hidden lg:block animate-fade-in animation-delay-600">
              <div className="glass-card p-10 space-y-8 group hover:border-primary/20 transition-all duration-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Live Next Match</span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-accent opacity-50" />
                </div>

                {nextMatch ? (
                  <div className="flex items-center justify-between gap-4">
                    <TeamEmblem name={nextMatch.home?.name || 'TBA'} label={nextMatch.home?.name?.[0] || '?'} />
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl font-black font-outfit tracking-widest text-white/20 uppercase italic">
                        {nextMatch.status === 'live' ? `${nextMatch.home_score} - ${nextMatch.away_score}` : 'VS'}
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-center">
                        {new Date(nextMatch.match_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • {new Date(nextMatch.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <TeamEmblem name={nextMatch.away?.name || 'TBA'} label={nextMatch.away?.name?.[0] || '?'} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted italic text-sm">Aucun match programmé.</div>
                )}

                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xl font-black font-outfit">{nextMatch?.status === 'live' ? 'En Direct' : 'Prévu'}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted">Statut</div>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="text-center">
                      <div className="text-xl font-black font-outfit">Stade</div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted">Okano Central</div>
                    </div>
                  </div>
                  <Link href="/matches" className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <TrendingUp className="w-5 h-5" />
                  </Link>
                </div>
              </div>
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
                <div key={match.id} className="sports-card p-6 flex items-center justify-between group cursor-pointer overflow-hidden">
                  {/* Glowing line overlay */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-all" />
                  
                  <div className="flex items-center gap-10 flex-1">
                    <div className="flex flex-col items-center gap-1.5 min-w-[80px] border-r border-white/5 pr-10">
                      <span className="text-[10px] font-black text-muted uppercase tracking-widest">{new Date(match.match_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest",
                        match.status === 'finished' ? "bg-white/5 text-muted" : "bg-primary/20 text-primary animate-pulse"
                      )}>{match.status === 'finished' ? 'Final' : 'Direct'}</span>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center justify-end gap-5">
                        <span className="font-bold text-sm text-right hidden md:block uppercase tracking-tight">{match.home?.name}</span>
                        <div className="w-10 h-10 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center font-black text-sm shadow-xl group-hover:scale-110 transition-transform">
                          {match.home?.name?.[0]}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 bg-white/5 px-8 py-3 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-all">
                        <span className="text-3xl font-black font-outfit tabular-nums tracking-tighter">{match.home_score}</span>
                        <div className="w-px h-6 bg-white/10" />
                        <span className="text-3xl font-black font-outfit tabular-nums tracking-tighter">{match.away_score}</span>
                      </div>

                      <div className="flex-1 flex items-center justify-start gap-5">
                        <div className="w-10 h-10 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center font-black text-sm shadow-xl group-hover:scale-110 transition-transform">
                          {match.away?.name?.[0]}
                        </div>
                        <span className="font-bold text-sm text-left hidden md:block uppercase tracking-tight">{match.away?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                        <td className="p-4 font-bold text-xs uppercase tracking-tight">{row.teams?.name}</td>
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
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-lg border border-white/5">
                          {player.name[0]}
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
