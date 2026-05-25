import { ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { MatchDetailClient } from "@/components/public/MatchDetailClient";
import { cn } from "@/lib/utils";

export const revalidate = 10;

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  const { id } = await params;

  const { data: match } = await supabase
    .from("matches")
    .select("*, home:teams!home_team_id(*, players(*)), away:teams!away_team_id(*, players(*))")
    .eq("id", id)
    .single();

  if (!match) {
    return (
      <main className="bg-background min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-black font-outfit text-foreground">Match introuvable</p>
          <Link href="/matches" className="text-primary font-bold text-sm hover:underline">
            ← Retour au calendrier
          </Link>
        </div>
      </main>
    );
  }

  const events    = match.events || [];
  const stats     = match.stats  || [{ label: "Possession", home: 50, away: 50 }];
  const matchDate = new Date(match.match_date);
  const isLive    = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <main className="bg-background pb-24 lg:pb-0">

      {/* ── Hero — score + teams dans le gradient violet ── */}
      <div className="match-hero-bg pt-16 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Barre de navigation top */}
          <div className="flex items-center gap-3 pt-4 mb-8">
            <Link
              href="/matches"
              className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0 hover:bg-white/25 active:scale-95 transition-all touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <span className="flex-1 text-center text-[10px] font-black text-white/55 uppercase tracking-[0.18em] truncate">
              {match.group_name || "Coupe Cantonale Fieng Okano"}
            </span>
            <div className="w-10 h-10 shrink-0" />
          </div>

          {/* Badge statut */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
              isLive
                ? "bg-green-500 text-white"
                : isFinished
                ? "bg-white/20 text-white/70"
                : "bg-accent text-white"
            )}>
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              {isLive ? "En Direct" : isFinished ? "Terminé" : matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          {/* Équipes + Score */}
          <div className="flex items-center gap-2 md:gap-8">

            {/* Équipe domicile */}
            <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
              <div className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 backdrop-blur-sm flex items-center justify-center",
                "text-2xl md:text-3xl font-black text-white shadow-lg shrink-0",
                "bg-white/15 border-white/25"
              )}>
                {match.home?.name?.[0] ?? "?"}
              </div>
              <p className="text-white font-black text-sm md:text-base text-center leading-tight line-clamp-2 px-1">
                {match.home?.name ?? "—"}
              </p>
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Domicile</span>
            </div>

            {/* Score central */}
            <div className="flex flex-col items-center shrink-0 min-w-[120px] md:min-w-[180px]">
              {match.status === "scheduled" ? (
                <span className="text-4xl md:text-6xl font-black font-outfit text-white tracking-tight">VS</span>
              ) : (
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="text-6xl md:text-8xl font-black font-outfit text-white tabular-nums leading-none">
                    {match.home_score ?? 0}
                  </span>
                  <span className="text-2xl md:text-4xl font-bold text-white/25 leading-none select-none">-</span>
                  <span className="text-6xl md:text-8xl font-black font-outfit text-white tabular-nums leading-none">
                    {match.away_score ?? 0}
                  </span>
                </div>
              )}
            </div>

            {/* Équipe extérieur */}
            <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
              <div className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 backdrop-blur-sm flex items-center justify-center",
                "text-2xl md:text-3xl font-black text-white shadow-lg shrink-0",
                "bg-white/10 border-white/20"
              )}>
                {match.away?.name?.[0] ?? "?"}
              </div>
              <p className="text-white font-black text-sm md:text-base text-center leading-tight line-clamp-2 px-1">
                {match.away?.name ?? "—"}
              </p>
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Extérieur</span>
            </div>
          </div>

          {/* Stade + Date */}
          <div className="flex items-center justify-center gap-2 mt-8 text-white/35 text-[10px] font-bold uppercase tracking-widest flex-wrap">
            <MapPin className="w-3 h-3 shrink-0 text-white/50" />
            <span className="text-white/50">Stade Okano</span>
            <span className="text-white/20">·</span>
            <span className="capitalize text-white/35">
              {matchDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs + contenu (client component) ── */}
      <MatchDetailClient match={match} events={events} stats={stats} />

    </main>
  );
}
