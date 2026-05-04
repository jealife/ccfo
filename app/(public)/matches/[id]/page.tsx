import { PublicNavbar } from "@/components/public/Navbar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MatchDetailClient } from "@/components/public/MatchDetailClient";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
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

          <div className="flex items-center justify-between gap-4 md:gap-12">
            {/* HOME TEAM */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-xl bg-background border border-white/10 flex items-center justify-center text-2xl md:text-4xl font-black shadow-xl">
                {match.home.name[0]}
              </div>
              <h2 className="text-sm md:text-xl font-black font-outfit uppercase tracking-tight text-center leading-tight">
                {match.home.name}
              </h2>
            </div>

            {/* SCOREBOARD CORE */}
            <div className="flex flex-col items-center justify-center">
              <div className="px-3 py-1 mb-2 rounded-md bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-muted">
                {match.status === 'finished' ? 'Terminé' : match.status === 'live' ? <span className="text-primary animate-pulse">En Direct</span> : 'Prévu'}
              </div>
              
              <div className="flex items-center justify-center gap-4 md:gap-8 bg-background/50 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/5">
                <span className="text-4xl md:text-7xl font-black font-outfit tabular-nums tracking-tighter text-white">
                  {match.status === 'scheduled' ? '-' : match.home_score}
                </span>
                <span className="text-xl md:text-3xl font-black text-white/20">-</span>
                <span className="text-4xl md:text-7xl font-black font-outfit tabular-nums tracking-tighter text-white">
                  {match.status === 'scheduled' ? '-' : match.away_score}
                </span>
              </div>
              
              <div className="mt-3 text-[10px] font-bold text-muted uppercase tracking-widest text-center">
                {new Date(match.match_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • Okano Central
              </div>
            </div>

            {/* AWAY TEAM */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-xl bg-background border border-white/10 flex items-center justify-center text-2xl md:text-4xl font-black shadow-xl">
                {match.away.name[0]}
              </div>
              <h2 className="text-sm md:text-xl font-black font-outfit uppercase tracking-tight text-center leading-tight">
                {match.away.name}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT TABS COMPONENT */}
      <MatchDetailClient match={match} events={events} stats={stats} />

    </main>
  );
}
