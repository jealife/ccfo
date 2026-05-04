"use client";

import { useState, useEffect, use } from "react";
import { ChevronLeft, Save, Plus, Activity, AlertCircle, Goal, Square, Play, SquareCheck, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { updateMatchLive } from "@/app/api/matches/actions";
import { AlertDialog } from "@/components/ui/Modal";

export default function MatchLiveController({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable State
  const [status, setStatus] = useState("scheduled");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  
  // New Event Form
  const [newEvent, setNewEvent] = useState({ minute: "", type: "goal", player: "", team: "home" });

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
      setHomeScore(data.home_score || 0);
      setAwayScore(data.away_score || 0);
      setEvents(data.events || []);

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

    const result = await updateMatchLive(id, {
      status,
      home_score: homeScore,
      away_score: awayScore,
      events: sortedEvents
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
    setEvents([...events, { ...newEvent, id: Date.now() }]);
    setNewEvent({ minute: "", type: "goal", player: "", team: "home" });
  };

  const removeEvent = (eventId: number) => {
    setEvents(events.filter(e => e.id !== eventId));
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
              <button onClick={() => setStatus('live')} className={cn("p-3 rounded-xl border flex flex-col items-center gap-2 transition-all", status === 'live' ? "bg-primary/20 border-primary text-primary" : "bg-card border-white/5 opacity-50")}>
                <Play className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase">En Direct</span>
              </button>
              <button onClick={() => setStatus('finished')} className={cn("p-3 rounded-xl border flex flex-col items-center gap-2 transition-all", status === 'finished' ? "bg-green-500/20 border-green-500 text-green-500" : "bg-card border-white/5 opacity-50")}>
                <SquareCheck className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase">Terminé</span>
              </button>
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
                  <option value="goal">⚽ But</option>
                  <option value="yellow">🟨 Carton Jaune</option>
                  <option value="red">🟥 Carton Rouge</option>
                </select>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <input type="number" placeholder="Min" value={newEvent.minute} onChange={(e) => setNewEvent({...newEvent, minute: e.target.value})} className="col-span-3 bg-card border border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-center tabular-nums" />
                <div className="col-span-6 relative">
                  <input 
                    list="player-list"
                    type="text" 
                    placeholder="Nom du joueur" 
                    value={newEvent.player} 
                    onChange={(e) => setNewEvent({...newEvent, player: e.target.value})} 
                    className="w-full bg-card border border-white/10 rounded-lg px-3 py-2 text-sm outline-none" 
                  />
                  <datalist id="player-list">
                    {(newEvent.team === 'home' ? homePlayers : awayPlayers).map(p => (
                      <option key={p.id} value={p.full_name}>{p.full_name} (#{p.jersey_number})</option>
                    ))}
                  </datalist>
                </div>
                <button onClick={addEvent} className="col-span-3 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* EVENT LIST */}
            <div className="space-y-3">
              {events.length === 0 && <p className="text-center text-muted italic text-sm py-8">Aucun événement enregistré.</p>}
              
              {events.map((evt) => (
                <div key={evt.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="w-12 text-center text-sm font-black font-outfit text-primary">{evt.minute}'</div>
                  <div className="flex items-center justify-center w-8 h-8 bg-background rounded-lg border border-white/10">
                    {evt.type === 'goal' ? <Goal className="w-4 h-4 text-white" /> : <Square className={cn("w-4 h-4 fill-current", evt.type === 'yellow' ? "text-yellow-500" : "text-red-500")} />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{evt.player}</div>
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
