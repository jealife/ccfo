"use client";

import { useState } from "react";
import { Search, Users, MapPin, Award, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeamsFilterClient({ teams }: { teams: any[] }) {
  const [search, setSearch] = useState("");
  const [village, setVillage] = useState("all");

  const villages = Array.from(new Set(teams.map((t) => t.village).filter(Boolean))).sort() as string[];

  const filtered = teams.filter((t) => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    const matchesVillage = village === "all" || t.village === village;
    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une équipe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 sm:w-auto">
          <Filter className="w-4 h-4 text-muted shrink-0 sm:hidden" />
          <select
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="flex-1 sm:w-52 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all"
          >
            <option value="all">Tous les villages</option>
            {villages.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((team: any) => (
          <div key={team.id} className="group relative">
            <div className="absolute -inset-0.5 bg-linear-to-r from-primary to-accent rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
            <div className="relative sports-card bg-card/60 backdrop-blur-xl border-white/5 p-5 md:p-8 flex flex-col h-full shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-secondary border border-white/10 flex items-center justify-center text-xl md:text-3xl font-black shadow-2xl group-hover:scale-110 transition-transform duration-500">
                  {team.name[0]}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Village</div>
                  <div className="font-bold flex items-center justify-end gap-1.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-accent" /> {team.village}
                  </div>
                </div>
              </div>

              <h3 className="text-xl md:text-2xl font-black font-outfit uppercase tracking-tight mb-6 group-hover:text-primary transition-colors">
                {team.name}
              </h3>

              <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">Effectif</span>
                  </div>
                  <span className="font-black font-outfit text-sm">{team.players?.[0]?.count || 0} Joueurs</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">Statut</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Confirmé</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-24 space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-muted/40" />
          </div>
          <h2 className="text-xl font-black font-outfit uppercase tracking-tight">Aucune équipe trouvée</h2>
          <p className="text-muted text-sm">
            {search ? `Aucun résultat pour "${search}"` : "Aucune équipe pour ce village."}
          </p>
        </div>
      )}
    </div>
  );
}
