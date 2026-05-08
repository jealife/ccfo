import { PublicNavbar } from "@/components/public/Navbar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MatchDetailClient } from "@/components/public/MatchDetailClient";
import { PublicFooter } from "@/components/public/Footer";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  const { id } = await params;
  
  // Fetch Match Details
  const { data: match } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(*, players(*)), away:teams!away_team_id(*, players(*))')
    .eq('id', id)
    .single();

  if (!match) return <div className="text-center p-20">Match non trouvé</div>;

  // Real Events and Stats from Database
  const events = match.events || [];
  const stats = match.stats || [
    { label: 'Possession', home: 50, away: 50 }
  ];

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30 pb-32">
      <PublicNavbar />

      {/* COMPACT SOFASCORE HEADER */}
      <section className="relative pt-24 pb-8 bg-card border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.1),transparent_70%)]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 max-w-5xl">
          <Link href="/matches" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-white transition-colors mb-8">
            <ChevronLeft className="w-4 h-4" /> Retour au calendrier
          </Link>

          <div className="flex items-center justify-between gap-2 md:gap-12 bg-white/5 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/5 opacity-50" />
            
            {/* HOME TEAM */}
            <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 z-10">
              <div className="w-12 h-12 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-secondary border border-white/10 flex items-center justify-center text-xl md:text-5xl font-black text-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
                {match.home.name[0]}
              </div>
              <h2 className="text-[9px] md:text-xl font-black font-outfit uppercase tracking-tighter text-center leading-tight text-white/90">
                {match.home.name}
              </h2>
            </div>

            {/* SCOREBOARD CORE */}
            <div className="flex flex-col items-center justify-center z-10 min-w-[100px] md:min-w-[200px]">
              <div className="px-3 py-1 mb-4 rounded-full bg-primary/20 border border-primary/30 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse-slow">
                {match.status === 'finished' ? <span className="text-muted">Terminé</span> : match.status === 'live' ? 'En Direct' : 'Prévu'}
              </div>
              
              <div className="flex items-center justify-center gap-3 md:gap-8">
                <span className="text-3xl md:text-8xl font-black font-outfit tabular-nums tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {match.status === 'scheduled' ? '-' : match.home_score}
                </span>
                <div className="flex flex-col items-center gap-1 opacity-20">
                  <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white" />
                  <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white" />
                </div>
                <span className="text-3xl md:text-8xl font-black font-outfit tabular-nums tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {match.status === 'scheduled' ? '-' : match.away_score}
                </span>
              </div>
              
              <div className="mt-4 px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[8px] md:text-[10px] font-bold text-muted/60 uppercase tracking-widest text-center">
                {new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • Stade Central
              </div>
            </div>

            {/* AWAY TEAM */}
            <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 z-10">
              <div className="w-12 h-12 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-secondary border border-white/10 flex items-center justify-center text-xl md:text-5xl font-black text-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
                {match.away.name[0]}
              </div>
              <h2 className="text-[9px] md:text-xl font-black font-outfit uppercase tracking-tighter text-center leading-tight text-white/90">
                {match.away.name}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT TABS COMPONENT */}
      <MatchDetailClient match={match} events={events} stats={stats} />
      
      <PublicFooter />
    </main>
  );
}
