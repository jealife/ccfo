"use client";

import { useState, useEffect } from "react";
import { Clock, Zap, Star, LayoutGrid, BarChart2, Users, Goal, Square, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function MatchDetailClient({ match: initialMatch, events: initialEvents, stats: initialStats }: any) {
  const [activeTab, setActiveTab] = useState("details");
  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState(initialEvents);
  const [stats, setStats] = useState(initialStats);
  const supabase = createClient();

  useEffect(() => {
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
          console.log('Realtime Update:', payload);
          setMatch((prev: any) => ({ ...prev, ...payload.new }));
          if (payload.new.events) setEvents(payload.new.events);
          if (payload.new.stats) setStats(payload.new.stats);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id, supabase]);

  const tabs = [
    { id: "details", label: "Détails", icon: <Clock className="w-4 h-4" /> },
    { id: "stats", label: "Statistiques", icon: <BarChart2 className="w-4 h-4" /> },
    { id: "lineups", label: "Compositions", icon: <Users className="w-4 h-4" /> },
  ];

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
                
                {events.map((event: any) => (
                  <div key={event.id} className="relative flex items-center gap-6">
                    <div className={cn(
                      "absolute left-[-29px] w-6 h-6 rounded-full border-4 border-background bg-card flex items-center justify-center z-10",
                      event.type === 'goal' ? "border-primary bg-primary/20 text-primary" : "border-white/10"
                    )}>
                      {event.type === 'goal' ? <Goal className="w-3 h-3" /> : <Square className={cn("w-3 h-3 fill-current", event.type === 'yellow' ? "text-yellow-500" : "text-red-500")} />}
                    </div>
                    
                    <div className="w-12 text-right">
                      <span className="text-sm font-black font-outfit text-white">{event.minute}'</span>
                    </div>
                    
                    <div className={cn(
                      "flex-1 p-4 rounded-2xl border border-white/5 flex items-center justify-between",
                      event.type === 'goal' ? "bg-primary/5 border-primary/20" : "bg-white/5"
                    )}>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white">{event.player}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">
                          {event.type === 'goal' ? 'But' : 'Carton'} • {event.team === 'home' ? match.home.name : match.away.name}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center font-black text-xs">
                        {event.team === 'home' ? match.home.name[0] : match.away.name[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* MOTM - Only if set */}
            {match.motm_player && (
              <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.1),transparent_50%)]">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-secondary border border-accent/20 flex items-center justify-center text-2xl md:text-3xl font-black text-accent relative shadow-lg shrink-0">
                  <Star className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 text-accent fill-current" />
                  {match.motm_player[0]}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-xl font-black font-outfit uppercase">{match.motm_player}</h4>
                  <p className="text-accent font-black uppercase tracking-widest text-[10px] mt-1">Homme du Match</p>
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
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className={homeVal >= awayVal ? "text-primary" : "text-white"}>{stat.home}</span>
                      <span className="text-xs font-black uppercase tracking-widest text-muted">{stat.label}</span>
                      <span className={awayVal >= homeVal ? "text-white" : "text-muted"}>{stat.away}</span>
                    </div>
                    <div className="h-1.5 flex gap-1 rounded-full overflow-hidden bg-background">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${homePerc}%` }} />
                      <div className="h-full bg-white/20 rounded-full transition-all" style={{ width: `${100 - homePerc}%` }} />
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
