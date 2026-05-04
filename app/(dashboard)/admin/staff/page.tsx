"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Download, 
  Filter, 
  MapPin, 
  Globe, 
  UserCircle,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    const { data, error } = await supabase
      .from('staff')
      .select('*, team:teams(name)')
      .order('last_name', { ascending: true });

    if (!error && data) {
      setStaff(data);
    }
    setLoading(false);
  }

  const filteredStaff = staff.filter(s => 
    s.first_name.toLowerCase().includes(search.toLowerCase()) ||
    s.last_name.toLowerCase().includes(search.toLowerCase()) ||
    s.team?.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Staff Technique</h1>
          <p className="text-muted text-sm">Supervision globale des encadreurs de toutes les équipes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre..." 
              className="pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-primary/50 outline-none transition-all w-full md:w-64"
            />
          </div>
          <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted hover:text-white">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted">Chargement du staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full py-20 text-center sports-card">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-muted italic">Aucun membre du staff trouvé.</p>
          </div>
        ) : filteredStaff.map((member) => (
          <div key={member.id} className="sports-card bg-card/30 backdrop-blur-xl border-white/5 p-5 flex flex-col gap-4 hover:border-primary/20 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-black text-xl text-muted group-hover:text-primary transition-colors">
                {member.first_name[0]}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate uppercase tracking-tight">{member.first_name} {member.last_name}</h3>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest">{member.role}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase">
                <Shield className="w-3 h-3 text-accent" />
                <span className="truncate">{member.team?.name || "Sans équipe"}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase">
                <Globe className="w-3 h-3 text-muted" />
                <span>{member.nationality}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase">
                <MapPin className="w-3 h-3 text-muted" />
                <span>{member.origin_village}</span>
              </div>
            </div>
            
            <button className="w-full mt-2 py-2 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
              Détails Profil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
