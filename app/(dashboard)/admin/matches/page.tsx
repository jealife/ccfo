"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Plus, 
  Trophy, 
  MapPin, 
  Clock, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Form State
  const [formData, setFormData] = useState({
    home_team_id: "",
    away_team_id: "",
    match_date: "",
    venue: "Stade Municipal",
    status: "scheduled"
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: mData } = await supabase
      .from('matches')
      .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .order('match_date', { ascending: true });
    
    const { data: tData } = await supabase
      .from('teams')
      .select('id, name')
      .eq('status', 'validated');

    setMatches(mData || []);
    setTeams(tData || []);
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.home_team_id === formData.away_team_id) {
      alert("Une équipe ne peut pas s'affronter elle-même !");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from('matches').insert([formData]);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      setShowForm(false);
      fetchData();
    }
    setIsLoading(false);
  };

  const handleDeleteMatch = async (id: string) => {
    if (confirm("Supprimer ce match ?")) {
      await supabase.from('matches').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Programmation des Matchs</h1>
          <p className="text-muted text-sm">Organisez les rencontres de la Coupe Cantonale Fieng Okano.</p>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          {showForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Annuler" : "Programmer un Match"}
        </button>
      </div>

      {/* NEW MATCH FORM */}
      {showForm && (
        <div className="glass-card p-8 border-primary/20 bg-linear-to-br from-card to-primary/5 animate-slide-up">
          <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Équipe Domicile</label>
              <select 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                value={formData.home_team_id}
                onChange={(e) => setFormData({...formData, home_team_id: e.target.value})}
              >
                <option value="">Sélectionner...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Équipe Extérieur</label>
              <select 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                value={formData.away_team_id}
                onChange={(e) => setFormData({...formData, away_team_id: e.target.value})}
              >
                <option value="">Sélectionner...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Date & Heure</label>
              <input 
                type="datetime-local"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                value={formData.match_date}
                onChange={(e) => setFormData({...formData, match_date: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="py-3.5 rounded-xl bg-white text-primary font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-all"
            >
              {isLoading ? "Enregistrement..." : "Confirmer le Match"}
            </button>
          </form>
        </div>
      )}

      {/* MATCH LIST */}
      <div className="grid grid-cols-1 gap-4">
        {matches.map((match) => (
          <div key={match.id} className="sports-card p-6 flex flex-col md:flex-row items-center justify-between group">
            <div className="flex items-center gap-8 flex-1 w-full">
              <div className="text-center md:border-r border-white/5 md:pr-8 min-w-[100px]">
                <div className="text-sm font-black font-outfit text-primary">
                  {new Date(match.match_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-[10px] font-bold text-muted uppercase">
                  {new Date(match.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center justify-end gap-3">
                  <span className="font-bold text-sm hidden sm:block uppercase tracking-tight">{match.home?.name}</span>
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm">{match.home?.name?.[0]}</div>
                </div>

                <div className="px-6 py-2 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/50">VS</span>
                </div>

                <div className="flex-1 flex items-center justify-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm">{match.away?.name?.[0]}</div>
                  <span className="font-bold text-sm hidden sm:block uppercase tracking-tight">{match.away?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6 md:mt-0 md:ml-8 pl-8 md:border-l border-white/5">
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 flex items-center justify-end gap-1">
                  <MapPin className="w-3 h-3 text-accent" /> {match.venue}
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => handleDeleteMatch(match.id)}
                    className="p-2 text-muted hover:text-red-500 transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                   <Link 
                    href={`/admin/matches/${match.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                   >
                     <Activity className="w-3.5 h-3.5" /> Gérer
                   </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {matches.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Calendar className="w-12 h-12 text-muted/20 mx-auto" />
            <p className="text-muted italic">Aucun match programmé pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>
  );
}
