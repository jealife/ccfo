"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Users,
  Search,
  Filter,
  Download,
  Printer,
  Shield,
  User,
  Activity
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlayerLicense } from "@/components/dashboard/PlayerLicense";
import { formatFrenchDate } from "@/lib/helpers";

type TeamOption = { id: string; name: string; village: string | null };
type AdminPlayer = {
  id: string;
  full_name: string;
  jersey_number: number | string | null;
  position: string | null;
  photo_url: string | null;
  nationality?: string | null;
  origin_village?: string | null;
  date_of_birth?: string | null;
  teams: { name: string; village: string | null } | null;
};

export default function AdminPlayersPage() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [printingPlayer, setPrintingPlayer] = useState<AdminPlayer | null>(null);
  const [printingAll, setPrintingAll] = useState(false);
  const [printAllConfirm, setPrintAllConfirm] = useState(false);
  const supabase = createClient();

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
      .select('*, teams(name, village)');
    
    if (selectedTeamId !== "all") {
      query = query.eq('team_id', selectedTeamId);
    }

    const { data } = await query.order('full_name', { ascending: true });
    setPlayers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    const kickoff = setTimeout(fetchTeams, 0);
    return () => clearTimeout(kickoff);
    // chargement initial uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const kickoff = setTimeout(fetchPlayers, 0);
    return () => clearTimeout(kickoff);
    // fetchPlayers dépend uniquement de selectedTeamId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId]);

  const handlePrint = (player: AdminPlayer) => {
    setPrintingPlayer(player);
  };

  const handleConfirmPrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ["Nom", "Date de naissance", "Équipe", "Village", "Numéro", "Poste", "Origine"],
      ...filteredPlayers.map(p => [
        p.full_name,
        p.date_of_birth ? formatFrenchDate(p.date_of_birth, { day: "2-digit", month: "2-digit", year: "numeric" }) : "",
        p.teams?.name || "",
        p.teams?.village || "",
        p.jersey_number || "",
        p.position || "",
        p.origin_village || "",
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `joueurs_ccfo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <button
            onClick={() => filteredPlayers.length > 5 ? setPrintAllConfirm(true) : setPrintingAll(true)}
            className="p-3 rounded-xl bg-white/5 border border-white/10 text-muted hover:text-white transition-all flex items-center gap-2"
            title="Imprimer toutes les licences filtrées"
          >
            <Printer className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Tout Imprimer</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Download className="w-4 h-4" /> Exporter CSV
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
              
              <div className="relative w-14 h-14 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center text-xl font-black shadow-xl shrink-0 overflow-hidden">
                {player.photo_url ? (
                  <Image src={player.photo_url} alt={player.full_name} fill sizes="56px" className="object-cover" />
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

              {/* Print Button - Visible on mobile, hover on desktop */}
              <div className="absolute top-2 right-2 md:inset-0 md:bg-primary/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center md:backdrop-blur-[2px]">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint(player);
                  }}
                  className="p-2 md:px-4 md:py-2 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-2 hover:scale-110 transition-all"
                >
                  <Printer className="w-4 h-4" /> <span className="hidden md:inline">Imprimer Licence</span>
                </button>
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

      {/* Print All Confirmation */}
      {printAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Printer className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-lg">Impression en volume</h3>
                <p className="text-sm text-muted">{filteredPlayers.length} licences à imprimer</p>
              </div>
            </div>
            <p className="text-sm text-muted">Vous allez générer un aperçu de <span className="text-white font-bold">{filteredPlayers.length} licences</span>. Affinez le filtre par équipe pour réduire le volume si nécessaire.</p>
            <div className="flex gap-3">
              <button onClick={() => setPrintAllConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm font-bold hover:bg-white/10 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => { setPrintAllConfirm(false); setPrintingAll(true); }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/80 transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Overlay */}
      {(printingPlayer || printingAll) && (
        <div className="fixed inset-0 z-100 bg-black/90 flex flex-col items-center gap-8 p-8 overflow-y-auto print-content backdrop-blur-md">
          {/* Preview Controls - Hidden during print */}
          <div className="flex items-center gap-4 sticky top-0 z-50 bg-black/50 p-4 rounded-2xl border border-white/10 backdrop-blur-md no-print">
            <button 
              onClick={() => {
                setPrintingPlayer(null);
                setPrintingAll(false);
              }}
              className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest transition-all"
            >
              Fermer l’Aperçu
            </button>
            <button 
              onClick={handleConfirmPrint}
              className="px-8 py-2 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Confirmer l’Impression
            </button>
          </div>

          <div className="flex flex-col items-center gap-8 w-full max-w-4xl py-12">
            {printingAll ? (
              filteredPlayers.map((p) => (
                <div key={p.id} className="break-after-page">
                  <PlayerLicense 
                    player={{
                      firstName: p.full_name.split(' ').slice(1).join(' ') || p.full_name,
                      lastName: p.full_name.split(' ')[0],
                      team: p.teams?.name || "Équipe",
                      number: p.jersey_number?.toString() || "00",
                      position: p.position || "Joueur",
                      village: p.teams?.village || "",
                      nationality: p.nationality || "Gabonaise",
                      photoUrl: p.photo_url ?? undefined,
                    }}
                  />
                </div>
              ))
            ) : printingPlayer && (
              <PlayerLicense 
                player={{
                  firstName: printingPlayer.full_name.split(' ').slice(1).join(' ') || printingPlayer.full_name,
                  lastName: printingPlayer.full_name.split(' ')[0],
                  team: printingPlayer.teams?.name || "Équipe",
                  number: printingPlayer.jersey_number?.toString() || "00",
                  position: printingPlayer.position || "Joueur",
                  village: printingPlayer.teams?.village || "",
                  nationality: printingPlayer.nationality || "Gabonaise",
                  photoUrl: printingPlayer.photo_url ?? undefined,
                }}
              />
            )}
          </div>

          <style jsx global>{`
            @media print {
              .no-print {
                display: none !important;
              }
              body > *:not(.print-content) {
                display: none !important;
              }
              .print-content {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                display: block !important;
                background: white !important;
                z-index: 9999;
                padding: 0 !important;
                overflow: visible !important;
              }
              .break-after-page {
                page-break-after: always;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
