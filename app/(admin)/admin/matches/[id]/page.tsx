"use client";

import { useState, useEffect, use } from "react";
import { ChevronLeft, Save, Plus, Activity, AlertCircle, Goal, Square, Play, SquareCheck, Clock, Star, ArrowLeftRight, RefreshCw, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { updateMatchLive } from "@/app/api/matches/actions";
import { AlertDialog } from "@/components/ui/Modal";
import type { MatchStat } from "@/lib/types";

export default function MatchLiveController({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable State
  const [status, setStatus] = useState("scheduled");
  const [motmPlayer, setMotmPlayer] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<any[]>([]);
  
  // New Event Form
  const [newEvent, setNewEvent] = useState({ minute: "", type: "goal", player: "", playerIn: "", team: "home" });

  // Modal State
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success"
  });

  useEffect(() => {
    fetchMatch();
  }, [id]);

  async function fetchMatch() {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .eq('id', id)
      .single();

    if (data) {
      setMatch(data);
      setStatus(data.status || 'scheduled');
      setMotmPlayer(data.motm_player || "");
      setHomeScore(data.home_score || 0);
      setAwayScore(data.away_score || 0);
      setEvents(data.events || []);
      const stats = (data.stats || []) as (MatchStat & { value?: string })[];
      const startedAtEntry = stats.find((s) => s.label === 'started_at');
      setStartedAt(startedAtEntry ? (startedAtEntry.value ?? null) : null);
      setMatchStats(stats.filter((s) => s.label !== 'started_at'));

      // Fetch players for both teams
      const [hRes, aRes] = await Promise.all([
        supabase.from('players').select('*').eq('team_id', data.home_team_id).order('jersey_number', { ascending: true }),
        supabase.from('players').select('*').eq('team_id', data.away_team_id).order('jersey_number', { ascending: true })
      ]);
      setHomePlayers(hRes.data || []);
      setAwayPlayers(aRes.data || []);
    }
    setLoading(false);
  }

  async function saveMatchDetails() {
    setSaving(true);
    
    // Sort events by minute
    const sortedEvents = [...events].sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
    setEvents(sortedEvents);

    const currentStartedAt = status === 'live' ? (startedAt || new Date().toISOString()) : startedAt;
    const finalStats = [...matchStats];
    if (currentStartedAt) {
      finalStats.push({ label: 'started_at', value: currentStartedAt });
    }

    const result = await updateMatchLive(id, {
      status,
      motm_player: motmPlayer,
      home_score: homeScore,
      away_score: awayScore,
      events: sortedEvents,
      stats: finalStats
    });

    setSaving(false);
    
    if (!result.success) {
      setAlert({
        isOpen: true,
        title: "Erreur",
        message: "Erreur lors de la mise à jour : " + result.error,
        type: "error"
      });
    } else {
      setAlert({
        isOpen: true,
        title: "Succès",
        message: "Match mis à jour avec succès ! Le site public est synchronisé.",
        type: "success"
      });
      fetchMatch();
    }
  }

  const addEvent = () => {
    if (!newEvent.minute || !newEvent.player) return;
    if (newEvent.type === 'substitution' && !newEvent.playerIn) return;
    const event = { ...newEvent, id: Date.now() };
    setEvents([...events, event]);

    // Automate Score Update
    if (event.type === 'goal') {
      if (event.team === 'home') setHomeScore(prev => prev + 1);
      else setAwayScore(prev => prev + 1);
    }

    setNewEvent({ minute: "", type: "goal", player: "", playerIn: "", team: "home" });
  };

  const removeEvent = (eventId: number) => {
    const eventToRemove = events.find(e => e.id === eventId);
    if (eventToRemove?.type === 'goal') {
      if (eventToRemove.team === 'home') setHomeScore(prev => Math.max(0, prev - 1));
      else setAwayScore(prev => Math.max(0, prev - 1));
    }
    setEvents(events.filter(e => e.id !== eventId));
  };

  // Detect score/events desync
  const goalCountHome = events.filter(e => e.type === 'goal' && e.team === 'home').length;
  const goalCountAway = events.filter(e => e.type === 'goal' && e.team === 'away').length;
  const scoreOutOfSync = goalCountHome !== homeScore || goalCountAway !== awayScore;

  const syncScoreFromEvents = () => {
    setHomeScore(goalCountHome);
    setAwayScore(goalCountAway);
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Chargement de la régie...</div>;
  if (!match) return <div className="p-20 text-center">Match introuvable</div>;

  return (
    <div className="space-y-8 pb-32 animate-fade-in max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/admin/matches" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted hover:text-white mb-4">
            <ChevronLeft className="w-4 h-4" /> Retour aux matchs
          </Link>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" /> Régie Live
          </h1>
        </div>

        <button 
          onClick={saveMatchDetails}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          {saving ? "Synchronisation..." : "Publier les changements"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COL: SCORE & STATUS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-8 space-y-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Contrôle du Score</h3>

            {scoreOutOfSync && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Score désynchronisé</p>
                  <p className="text-[10px] text-yellow-500/70 mt-0.5">Buts comptés : {goalCountHome} – {goalCountAway}</p>
                </div>
                <button onClick={syncScoreFromEvents} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/30 transition-colors shrink-0">
                  <RefreshCw className="w-3 h-3" /> Sync
                </button>
              </div>
            )}

            <div className="flex flex-col gap-6">
              {/* HOME */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="font-bold">{match.home.name}</div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setHomeScore(Math.max(0, homeScore - 1))} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black">-</button>
                  <span className="text-2xl font-black tabular-nums w-8 text-center">{homeScore}</span>
                  <button onClick={() => setHomeScore(homeScore + 1)} className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black">+</button>
                </div>
              </div>

              {/* AWAY */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="font-bold">{match.away.name}</div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setAwayScore(Math.max(0, awayScore - 1))} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black">-</button>
                  <span className="text-2xl font-black tabular-nums w-8 text-center">{awayScore}</span>
                  <button onClick={() => setAwayScore(awayScore + 1)} className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black">+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Statut du Match</h3>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setStatus('scheduled')} className={cn("p-3 rounded-xl border flex flex-col items-center gap-2 transition-all", status === 'scheduled' ? "bg-white/10 border-white/20" : "bg-card border-white/5 opacity-50")}>
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase">Prévu</span>
              </button>
              <button 
                onClick={() => {
                  setStatus('live');
                  if (!startedAt) setStartedAt(new Date().toISOString());
                }} 
                className={cn("p-3 rounded-xl border flex flex-col items-center gap-2 transition-all", status === 'live' ? "bg-primary/20 border-primary text-primary" : "bg-card border-white/5 opacity-50")}
              >
                <Play className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase">En Direct</span>
              </button>
              <button onClick={() => setStatus('finished')} className={cn("p-3 rounded-xl border flex flex-col items-center gap-2 transition-all", status === 'finished' ? "bg-green-500/20 border-green-500 text-green-500" : "bg-card border-white/5 opacity-50")}>
                <SquareCheck className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase">Terminé</span>
              </button>
            </div>
          </div>
          
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Homme du Match</h3>
            <div className="relative">
              <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
              <input 
                list="all-players-list"
                placeholder="Choisir l'homme du match..." 
                value={motmPlayer}
                onChange={(e) => setMotmPlayer(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition-all"
              />
              <datalist id="all-players-list">
                {[...homePlayers, ...awayPlayers].map(p => (
                  <option key={p.id} value={p.full_name}>{p.full_name} ({p.team_id === match.home_team_id ? match.home.name : match.away.name})</option>
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* RIGHT COL: TIMELINE EVENTS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-8 space-y-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Événements (Timeline)</h3>
            
            {/* ADD EVENT FORM */}
            <div className="p-4 bg-background/50 border border-white/5 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select value={newEvent.team} onChange={(e) => setNewEvent({...newEvent, team: e.target.value})} className="bg-card border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="home">{match.home.name} (Dom)</option>
                  <option value="away">{match.away.name} (Ext)</option>
                </select>
                <select value={newEvent.type} onChange={(e) => setNewEvent({...newEvent, type: e.target.value})} className="bg-card border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="goal">But</option>
                  <option value="yellow">Carton Jaune</option>
                  <option value="red">Carton Rouge</option>
                  <option value="substitution">Changement</option>
                </select>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <input type="number" placeholder="Min" value={newEvent.minute} onChange={(e) => setNewEvent({...newEvent, minute: e.target.value})} className="col-span-3 bg-card border border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-center tabular-nums" />
                <div className="col-span-6 relative">
                  <input
                    list="player-list-out"
                    type="text"
                    placeholder={newEvent.type === 'substitution' ? "Joueur sortant" : "Nom du joueur"}
                    value={newEvent.player}
                    onChange={(e) => setNewEvent({...newEvent, player: e.target.value})}
                    className="w-full bg-card border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                  <datalist id="player-list-out">
                    {(newEvent.team === 'home' ? homePlayers : awayPlayers).map(p => (
                      <option key={p.id} value={p.full_name}>{p.full_name} (#{p.jersey_number})</option>
                    ))}
                  </datalist>
                </div>
                <button onClick={addEvent} className="col-span-3 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {newEvent.type === 'substitution' && (
                <div className="relative">
                  <input
                    list="player-list-in"
                    type="text"
                    placeholder="Joueur entrant"
                    value={newEvent.playerIn}
                    onChange={(e) => setNewEvent({...newEvent, playerIn: e.target.value})}
                    className="w-full bg-card border border-primary/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all"
                  />
                  <datalist id="player-list-in">
                    {(newEvent.team === 'home' ? homePlayers : awayPlayers).map(p => (
                      <option key={p.id} value={p.full_name}>{p.full_name} (#{p.jersey_number})</option>
                    ))}
                  </datalist>
                </div>
              )}
            </div>

            {/* EVENT LIST */}
            <div className="space-y-3">
              {events.length === 0 && <p className="text-center text-muted italic text-sm py-8">Aucun événement enregistré.</p>}
              
              {events.map((evt) => (
                <div key={evt.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="w-12 text-center text-sm font-black font-outfit text-primary">{evt.minute}'</div>
                  <div className="flex items-center justify-center w-8 h-8 bg-background rounded-lg border border-white/10">
                    {evt.type === 'goal' ? (
                      <Goal className="w-4 h-4 text-white" />
                    ) : evt.type === 'substitution' ? (
                      <ArrowLeftRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <Square className={cn("w-4 h-4 fill-current", evt.type === 'yellow' ? "text-yellow-500" : "text-red-500")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {evt.type === 'substitution' ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                          <span className="text-red-400 text-[10px]">↓</span>
                          <span className="truncate">{evt.player}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                          <span className="text-green-400 text-[10px]">↑</span>
                          <span className="truncate">{evt.playerIn}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="font-bold text-sm">{evt.player}</div>
                    )}
                    <div className="text-[10px] text-muted uppercase tracking-widest font-black">{evt.team === 'home' ? match.home.name : match.away.name}</div>
                  </div>
                  <button onClick={() => removeEvent(evt.id)} className="p-2 text-muted hover:text-red-500 transition-colors">
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog 
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}
