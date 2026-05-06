"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter,
  Download,
  Printer,
  ChevronRight,
  Shield,
  MapPin,
  User,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function AdminPlayersPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [selectedTeamId]);

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('id, name, village')
      .eq('status', 'validated')
      .order('name', { ascending: true });
    setTeams(data || []);
  }

  async function fetchPlayers() {
    setLoading(true);
    let query = supabase
      .from('players')
      .select('*, teams(name)');
    
    if (selectedTeamId !== "all") {
      query = query.eq('team_id', selectedTeamId);
    }

    const { data } = await query.order('full_name', { ascending: true });
    setPlayers(data || []);
    setLoading(false);
  }

  const filteredPlayers = players.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.jersey_number?.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Base de Données Joueurs</h1>
          <p className="text-muted text-sm mt-1">Consultez et gérez les effectifs par équipe.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-muted hover:text-white transition-all">
            <Printer className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Download className="w-4 h-4" /> Exporter PDF
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center bg-card/30 border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text"
            placeholder="Rechercher un joueur ou un numéro..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-primary transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select 
            className="flex-1 md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
          >
            <option value="all">Toutes les équipes</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.village})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Players List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="sports-card h-24 bg-white/5 animate-pulse rounded-xl" />
          ))
        ) : filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <div key={player.id} className="sports-card p-4 flex items-center gap-4 bg-card/30 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Shield className="w-12 h-12 rotate-12" />
              </div>
              
              <div className="w-14 h-14 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center text-xl font-black shadow-xl shrink-0 overflow-hidden">
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                    {player.jersey_number || "?"}
                  </span>
                  <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{player.full_name}</h3>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
                    <Activity className="w-3 h-3 text-accent" /> {player.position || "Poste"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary/60">
                    <Shield className="w-3 h-3" /> {player.teams?.name}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <Users className="w-12 h-12 text-muted/20 mx-auto" />
            <p className="text-muted italic">Aucun joueur trouvé pour cette sélection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
