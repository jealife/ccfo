"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { MatchTimer } from "./MatchTimer";

function TeamEmblem({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 group/team">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-background border border-white/10 flex items-center justify-center text-xl md:text-3xl font-black shadow-2xl group-hover/team:scale-110 group-hover/team:border-primary/50 transition-all duration-500">
        {label}
      </div>
      <span className="text-[10px] md:text-xs font-black font-outfit uppercase tracking-tighter text-center max-w-[80px] md:max-w-[120px] leading-tight">
        {name}
      </span>
    </div>
  );
}

export function LiveHeroMatch({ initialMatch }: { initialMatch: any }) {
  const [match, setMatch] = useState(initialMatch);
  const supabase = createClient();

  useEffect(() => {
    if (!match?.id) return;

    const channel = supabase
      .channel(`hero-match-${match.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${match.id}`
        },
        (payload) => {
          setMatch((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match?.id, supabase]);

  if (!match) return null;

  const startedAt = match.stats?.find((s: any) => s.label === 'started_at')?.value;

  return (
    <div className="glass-card p-10 space-y-8 group hover:border-primary/20 transition-all duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", match.status === 'live' ? "bg-red-500 animate-pulse" : "bg-white/20")} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            {match.status === 'live' ? 'En Direct' : 'Match à l\'affiche'}
          </span>
        </div>
        <ShieldCheck className="w-5 h-5 text-accent opacity-50" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <TeamEmblem name={match.home?.name || 'TBA'} label={match.home?.name?.[0] || '?'} />
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "text-3xl font-black font-outfit tracking-widest uppercase italic",
            match.status === 'live' ? "text-primary animate-pulse" : "text-white/20"
          )}>
            {match.status === 'scheduled' ? 'VS' : `${match.home_score} - ${match.away_score}`}
          </div>
          <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-center">
            {match.status === 'live' ? 'En Direct' : `${new Date(match.match_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • ${new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>
        <TeamEmblem name={match.away?.name || 'TBA'} label={match.away?.name?.[0] || '?'} />
      </div>

      <div className="pt-8 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={cn("text-xl font-black font-outfit", match.status === 'live' && "text-primary")}>
              {match.status === 'live' ? (
                <MatchTimer startedAt={startedAt || undefined} status={match.status} />
              ) : match.status === 'finished' ? 'Terminé' : 'Prévu'}
            </div>
            <div className="text-[8px] font-black uppercase tracking-widest text-muted">
              {match.status === 'live' ? 'Temps Écoulé' : 'Statut'}
            </div>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="text-center">
            <div className="text-xl font-black font-outfit">Stade</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-muted">Okano Central</div>
          </div>
        </div>
        <Link href={`/matches/${match.id}`} className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
          <TrendingUp className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
