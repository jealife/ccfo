"use client";

import { useState, useEffect } from "react";
import { Clock, Zap, Star, LayoutGrid, BarChart2, Users, Goal, Square, User, Award, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MatchTimer } from "./MatchTimer";

export function MatchDetailClient({ match: initialMatch, events: initialEvents, stats: initialStats }: any) {
  const [activeTab, setActiveTab] = useState("details");
  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState(initialEvents);
  const [stats, setStats] = useState(initialStats || []);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const processStats = (rawStats: any[]) => {
      const startedAtEntry = rawStats?.find((s: any) => s.label === 'started_at');
      if (startedAtEntry) setStartedAt(startedAtEntry.value);
      return rawStats?.filter((s: any) => s.label !== 'started_at') || [];
    };

    setStats(processStats(initialStats));

    const channel = supabase
      .channel(`match-${match.id}`)
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
          if (payload.new.events) setEvents(payload.new.events);
          if (payload.new.stats) setStats(processStats(payload.new.stats));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id, supabase, initialStats]);

  const tabs = [
    { id: "details", label: "Détails", icon: <Clock className="w-4 h-4" /> },
    { id: "stats", label: "Statistiques", icon: <BarChart2 className="w-4 h-4" /> },
    { id: "lineups", label: "Compositions", icon: <Users className="w-4 h-4" /> },
  ];

  // Helper to find player photo from rosters
  const getPlayerInfo = (name: string, teamSide: 'home' | 'away') => {
    const players = teamSide === 'home' ? match.home.players : match.away.players;
    return players?.find((p: any) => p.full_name === name || name.includes(p.full_name) || p.full_name.includes(name));
  };

  return (
    <div className="w-full">
      {/* TABS NAVIGATION */}
      <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-md border-b border-white/5 pt-4">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 pb-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors relative",
                  activeTab === tab.id ? "text-primary" : "text-muted hover:text-white"
                )}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-[-16px] left-0 w-full h-1 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* TAB: DETAILS (TIMELINE) */}
        {activeTab === "details" && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-8">Événements du match</h3>
              <div className="relative pl-6 space-y-8">
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/10" />
                
                {events.map((event: any) => {
                  const playerInfo = getPlayerInfo(event.player, event.team);
                  const playerInInfo = event.playerIn ? getPlayerInfo(event.playerIn, event.team) : null;
                  const isSubstitution = event.type === 'substitution';
                  return (
                    <div key={event.id} className="relative flex items-center gap-4 md:gap-6">
                      <div className={cn(
                        "absolute left-[-29px] w-6 h-6 rounded-full border-4 border-background bg-card flex items-center justify-center z-10",
                        event.type === 'goal' ? "border-primary bg-primary/20 text-primary" : isSubstitution ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-white/10"
                      )}>
                        {event.type === 'goal' ? (
                          <Goal className="w-3 h-3" />
                        ) : isSubstitution ? (
                          <ArrowLeftRight className="w-3 h-3" />
                        ) : (
                          <Square className={cn("w-3 h-3 fill-current", event.type === 'yellow' ? "text-yellow-500" : "text-red-500")} />
                        )}
                      </div>

                      <div className="w-10 md:w-12 text-right">
                        <span className="text-[10px] md:text-sm font-black font-outfit text-white/60">{event.minute}'</span>
                      </div>

                      <div className={cn(
                        "flex-1 p-3 md:p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4",
                        event.type === 'goal' ? "bg-primary/5 border-primary/20" : isSubstitution ? "bg-green-500/5 border-green-500/10" : "bg-white/5"
                      )}>
                        {isSubstitution ? (
                          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="flex flex-col gap-2 min-w-0 flex-1">
                              {/* Joueur sortant */}
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-background border border-white/10 overflow-hidden shrink-0">
                                  {playerInfo?.photo_url ? (
                                    <img src={playerInfo.photo_url} alt={event.player} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-[10px] text-muted">{event.player?.[0] || "?"}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-red-400 text-xs font-black shrink-0">↓</span>
                                  <span className="font-bold text-sm text-white truncate">{event.player}</span>
                                </div>
                              </div>
                              {/* Joueur entrant */}
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-background border border-white/10 overflow-hidden shrink-0">
                                  {playerInInfo?.photo_url ? (
                                    <img src={playerInInfo.photo_url} alt={event.playerIn} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-[10px] text-muted">{event.playerIn?.[0] || "?"}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-green-400 text-xs font-black shrink-0">↑</span>
                                  <span className="font-bold text-sm text-white truncate">{event.playerIn}</span>
                                </div>
                              </div>
                              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted">
                                Changement • {event.team === 'home' ? match.home.name : match.away.name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background border border-white/10 overflow-hidden shrink-0">
                              {playerInfo?.photo_url ? (
                                <img src={playerInfo.photo_url} alt={event.player} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-[10px] text-muted">
                                  {event.player?.[0] || "?"}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-sm md:text-base text-white truncate leading-tight">{event.player}</span>
                              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted mt-0.5">
                                {event.type === 'goal' ? 'But' : 'Carton'} • {event.team === 'home' ? match.home.name : match.away.name}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-background/50 flex items-center justify-center font-black text-[9px] md:text-xs shrink-0 border border-white/5">
                          {event.team === 'home' ? match.home.name[0] : match.away.name[0]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
                <MatchTimer startedAt={startedAt || undefined} status={match.status} className="mb-4" />
                
                {match.motm_player && (
              <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-accent/50 to-primary/50 rounded-4xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative glass-card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 md:gap-10 bg-linear-to-br from-accent/10 via-background to-background border-accent/20">
                  {/* Premium Player Photo Wrapper */}
                  <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-secondary border-2 border-accent/30 overflow-hidden shadow-2xl relative z-10">
                      {/* Try to find MOTM photo */}
                      {(() => {
                        const motmInfo = getPlayerInfo(match.motm_player, match.home.players?.some((p:any) => p.full_name === match.motm_player) ? 'home' : 'away');
                        return motmInfo?.photo_url ? (
                          <img src={motmInfo.photo_url} alt={match.motm_player} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-black text-accent/30">
                            {match.motm_player[0]}
                          </div>
                        );
                      })()}
                    </div>
                    {/* Floating Badge */}
                    <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-10 h-10 md:w-14 md:h-14 rounded-full bg-accent text-background flex items-center justify-center shadow-2xl z-20 animate-bounce-slow">
                      <Star className="w-5 h-5 md:w-8 md:h-8 fill-current" />
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2 md:space-y-4">
                    <div>
                      <h4 className="text-2xl md:text-5xl font-black font-outfit uppercase tracking-tighter leading-none italic">{match.motm_player}</h4>
                      <p className="text-accent font-black uppercase tracking-[0.3em] text-[10px] md:text-xs mt-2 flex items-center justify-center sm:justify-start gap-2">
                        <Award className="w-4 h-4" /> Homme du Match
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-muted">
                        Performance Exceptionnelle
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: STATS */}
        {activeTab === "stats" && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-10 space-y-8">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">{match.home.name[0]}</div>
                  <span className="hidden sm:block">{match.home.name}</span>
                </div>
                <span className="text-muted">Statistiques d'équipe</span>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block">{match.away.name}</span>
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">{match.away.name[0]}</div>
                </div>
              </div>
              
              {stats.map((stat: any, i: number) => {
                const homeVal = typeof stat.home === 'string' ? parseFloat(stat.home) : stat.home;
                const awayVal = typeof stat.away === 'string' ? parseFloat(stat.away) : stat.away;
                const total = homeVal + awayVal || 1;
                const homePerc = (homeVal / total) * 100;
                
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center justify-between text-xs md:text-sm font-black uppercase tracking-tight">
                      <span className={homeVal >= awayVal ? "text-primary" : "text-white/60"}>{stat.home}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40">{stat.label}</span>
                      <span className={awayVal >= homeVal ? "text-white" : "text-white/60"}>{stat.away}</span>
                    </div>
                    <div className="h-2 flex gap-1 rounded-full overflow-hidden bg-white/5 p-0.5">
                      <div 
                        className="h-full bg-linear-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${homePerc}%` }} 
                      />
                      <div 
                        className="h-full bg-linear-to-l from-white to-white/60 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${100 - homePerc}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: LINEUPS */}
        {activeTab === "lineups" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* HOME LINEUP */}
            <div className="glass-card overflow-hidden">
              <div className="bg-white/5 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background border border-white/10 flex items-center justify-center font-black text-lg">
                  {match.home.name[0]}
                </div>
                <div>
                  <div className="font-black uppercase text-sm tracking-tight">{match.home.name}</div>
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Effectif Officiel</div>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {match.home.players?.length > 0 ? match.home.players.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 hover:bg-white/5 transition-colors">
                    <div className="w-6 text-right font-black font-outfit text-primary text-xs">{p.jersey_number}</div>
                    <div className="w-8 h-8 rounded-full bg-background border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate uppercase tracking-tight">{p.full_name}</div>
                      <div className="text-[9px] font-black text-muted uppercase tracking-widest">{p.position}</div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted text-xs italic">Composition non disponible</div>
                )}
              </div>
            </div>

            {/* AWAY LINEUP */}
            <div className="glass-card overflow-hidden">
              <div className="bg-white/5 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background border border-white/10 flex items-center justify-center font-black text-lg">
                  {match.away.name[0]}
                </div>
                <div>
                  <div className="font-black uppercase text-sm tracking-tight">{match.away.name}</div>
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Effectif Officiel</div>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {match.away.players?.length > 0 ? match.away.players.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 hover:bg-white/5 transition-colors">
                    <div className="w-6 text-right font-black font-outfit text-primary text-xs">{p.jersey_number}</div>
                    <div className="w-8 h-8 rounded-full bg-background border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate uppercase tracking-tight">{p.full_name}</div>
                      <div className="text-[9px] font-black text-muted uppercase tracking-widest">{p.position}</div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted text-xs italic">Composition non disponible</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
