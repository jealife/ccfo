"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Printer,
  Shield,
  UserSquare2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function AdminStaffPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [selectedTeamId]);

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('id, name, village')
      .eq('status', 'validated')
      .order('name', { ascending: true });
    setTeams(data || []);
  }

  async function fetchStaff() {
    setLoading(true);
    let query = supabase
      .from('staff')
      .select('*, teams(name)');
    
    if (selectedTeamId !== "all") {
      query = query.eq('team_id', selectedTeamId);
    }

    const { data } = await query.order('first_name', { ascending: true });
    setStaff(data || []);
    setLoading(false);
  }

  const filteredStaff = staff.filter(s => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Répertoire du Staff</h1>
          <p className="text-muted text-sm mt-1">Consultez les membres techniques de chaque club.</p>
        </div>
        
        <button
          onClick={() => window.print()}
          className="p-3 rounded-xl bg-white/5 border border-white/10 text-muted hover:text-white transition-all"
          title="Imprimer"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center bg-card/30 border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text"
            placeholder="Rechercher par nom ou fonction..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-accent transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select 
            className="flex-1 md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all text-sm"
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

      {/* Staff List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="sports-card h-24 bg-white/5 animate-pulse rounded-xl" />
          ))
        ) : filteredStaff.length > 0 ? (
          filteredStaff.map((member) => (
            <div key={member.id} className="sports-card p-4 flex items-center gap-4 bg-card/30 border-white/5 hover:border-accent/20 transition-all group relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center text-xl font-black shadow-xl shrink-0 overflow-hidden">
                <UserSquare2 className="w-6 h-6 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate group-hover:text-accent transition-colors">{member.first_name} {member.last_name}</h3>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/80">
                    {member.role || "Staff Technique"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent/60">
                    <Shield className="w-3 h-3" /> {member.teams?.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted mt-1 italic">
                    Origine: {member.origin || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <Users className="w-12 h-12 text-muted/20 mx-auto" />
            <p className="text-muted italic">Aucun membre du staff trouvé pour cette sélection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
