"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MatchTimer } from "./MatchTimer";

export function LiveHeroMatch({ initialMatch }: { initialMatch: any }) {
  const [match, setMatch] = useState(initialMatch);
  const supabase = createClient();

  useEffect(() => {
    if (!match?.id) return;
    const channel = supabase
      .channel(`hero-match-${match.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}` },
        (payload) => setMatch((prev: any) => ({ ...prev, ...payload.new }))
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [match?.id, supabase]);

  if (!match) return null;

  const startedAt = match.stats?.find((s: any) => s.label === "started_at")?.value;
  const matchDate = new Date(match.match_date);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";

  return (
    <Link href={`/matches/${match.id}`} className="block group touch-manipulation">
      <div className="hero-card p-6 md:p-8 active:scale-[0.99] transition-transform duration-150">
        {/* Decorative orbs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/3 pointer-events-none" />

        {/* Header row */}
        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full shrink-0",
              isLive ? "bg-red-400 animate-pulse" : "bg-white/30"
            )} />
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
              {isLive ? "En Direct" : isFinished ? "Terminé" : "Match à l'Affiche"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-medium">Stade Okano</span>
          </div>
        </div>

        {/* Competition label */}
        <div className="relative text-center mb-6">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
            Coupe Cantonale Fieng Okano
          </span>
        </div>

        {/* Teams + Score */}
        <div className="relative flex items-center justify-between gap-2 md:gap-6">

          {/* Home team */}
          <div className="flex flex-col items-center gap-2.5 flex-1">
            <div className="w-14 h-14 md:w-18 md:h-18 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center text-2xl md:text-3xl font-black text-white">
              {match.home?.name?.[0] ?? "?"}
            </div>
            <span className="text-xs md:text-sm font-bold text-white/90 text-center leading-tight max-w-[80px]">
              {match.home?.name}
            </span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Domicile</span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-2 shrink-0 min-w-[90px] md:min-w-[120px]">
            {isScheduled ? (
              <>
                <div className="text-3xl md:text-5xl font-black text-white tracking-tight">VS</div>
                <div className="text-[10px] text-white/50 font-bold text-center">
                  {matchDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  {" • "}
                  {matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                  {match.home_score} : {match.away_score}
                </div>
                {isLive ? (
                  <MatchTimer startedAt={startedAt} status={match.status} />
                ) : (
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Temps réglementaire</span>
                )}
              </>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2.5 flex-1">
            <div className="w-14 h-14 md:w-18 md:h-18 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center text-2xl md:text-3xl font-black text-white">
              {match.away?.name?.[0] ?? "?"}
            </div>
            <span className="text-xs md:text-sm font-bold text-white/90 text-center leading-tight max-w-[80px]">
              {match.away?.name}
            </span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Extérieur</span>
          </div>
        </div>

        {/* Footer row */}
        <div className="relative mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-medium capitalize">
            {matchDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/60 font-bold group-hover:text-white transition-colors">
            Voir les détails <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
