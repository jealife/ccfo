"use client";

import { useState } from "react";
import { Search, Users, MapPin, Award, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

export function TeamsFilterClient({ teams }: { teams: Team[] }) {
  const [search,  setSearch]  = useState("");
  const [village, setVillage] = useState("all");

  const villages = Array.from(
    new Set(teams.map((t) => t.village).filter(Boolean))
  ).sort() as string[];

  const filtered = teams.filter((t) => {
    const matchesSearch  = !search  || t.name.toLowerCase().includes(search.toLowerCase());
    const matchesVillage = village === "all" || t.village === village;
    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-8">

      {/* ── Filtres ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une équipe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all placeholder:text-muted"
          />
        </div>
        <select
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          aria-label="Filtrer par village"
          className="sm:w-52 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-all"
        >
          <option value="all">Tous les villages</option>
          {villages.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* ── Grille équipes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filtered.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className={cn(
              "bg-card rounded-2xl border border-border p-6 flex flex-col gap-4",
              "shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-200 group active:scale-[0.99]"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary group-hover:scale-105 transition-transform duration-300">
                {team.name[0]}
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted mb-0.5">Village</div>
                <div className="flex items-center justify-end gap-1 text-sm font-bold text-foreground">
                  <MapPin className="w-3 h-3 text-accent shrink-0" />
                  {team.village || "—"}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-black font-outfit uppercase tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
              {team.name}
            </h3>

            <div className="space-y-2 mt-auto">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary border border-border">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Effectif</span>
                </div>
                <span className="font-black text-sm text-foreground">
                  {(team.players as Array<{ count: number }> | undefined)?.[0]?.count ?? 0} joueurs
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary border border-border">
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-muted" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Statut</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Confirmé</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-muted group-hover:text-primary transition-colors -mt-1">
              Voir l&apos;effectif <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-muted/40" />
          </div>
          <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-foreground">
            Aucune équipe trouvée
          </h2>
          <p className="text-muted text-sm">
            {search ? `Aucun résultat pour « ${search} »` : "Aucune équipe pour ce village."}
          </p>
        </div>
      )}
    </div>
  );
}
