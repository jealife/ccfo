"use client";

import { useState, useEffect } from "react";
import { Award, Search, Filter, Download, MoreVertical, MapPin, Printer, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingPlayer, setPrintingPlayer] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPlayers() {
      const { data } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(name, village, jersey_color)
        `)
        .order('created_at', { ascending: false });
      
      setPlayers(data || []);
      setLoading(false);
    }
    fetchPlayers();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Base de Joueurs</h1>
          <p className="text-muted text-sm">Gérez l'ensemble des joueurs inscrits au tournoi ({players.length}).</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              placeholder="Rechercher un joueur..." 
              className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-primary outline-none transition-all w-full sm:w-64"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all text-xs font-black uppercase tracking-widest w-full sm:w-auto">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      <div className="sports-card bg-card/30 backdrop-blur-xl border-white/5 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-muted animate-pulse">Chargement des joueurs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Joueur</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Équipe</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">N°</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Poste</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Village (Origine)</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                          {player.photo_url ? (
                            <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-muted">{player.full_name?.[0]}</span>
                          )}
                        </div>
                        <span className="font-bold uppercase tracking-tight">{player.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-muted">{player.team?.name || "Sans équipe"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                        {player.jersey_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> {player.origin_village}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setPrintingPlayer(player)}
                        className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg text-muted transition-colors"
                        title="Imprimer la Licence"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-muted transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {players.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted italic text-sm">
                      Aucun joueur enregistré pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE PRÉVISUALISATION DE LA LICENCE */}
      {printingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm print:bg-white print:backdrop-blur-none">
          {/* Boutons d'action (Cachés à l'impression) */}
          <div className="absolute top-8 right-8 flex gap-4 print:hidden">
            <button 
              onClick={() => setPrintingPlayer(null)}
              className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
            >
              Fermer
            </button>
            <button 
              onClick={handlePrint}
              className="px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-primary/20"
            >
              <Download className="w-5 h-5" /> Télécharger PDF
            </button>
          </div>

          {/* Le Badge (Visible à l'écran et à l'impression) */}
          <div 
            className="w-[54mm] h-[85mm] rounded-xl overflow-hidden relative text-white shadow-2xl flex flex-col scale-150 md:scale-[2] print:scale-100"
            style={{ 
              WebkitPrintColorAdjust: 'exact', 
              printColorAdjust: 'exact',
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0f0f 100%)'
            }}
          >
            {/* Header / Bandeau Haut */}
            <div className="bg-[#cc0000] p-2 flex items-center justify-between z-10 shrink-0 border-b-2 border-[#ffcc00]/30">
              <img src="/Logo-CCFO-Blanc.png" alt="CCFO Logo" className="w-6 h-6 object-contain" />
              <div className="text-right">
                <h1 className="text-[7px] font-black uppercase tracking-widest text-white leading-tight">Coupe Cantonale</h1>
                <p className="text-[6px] font-bold text-[#ffcc00] tracking-widest">Fieng Okano 2026</p>
              </div>
            </div>

            {/* Photo Section (Prend une bonne partie du centre) */}
            <div className="flex-1 relative bg-[#111]">
              {printingPlayer.photo_url ? (
                <img src={printingPlayer.photo_url} alt="Photo" className="w-full h-full object-cover opacity-90 mix-blend-luminosity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shield className="w-16 h-16 text-white/5" />
                </div>
              )}
              {/* Dégradé sur la photo pour la fondre avec le bas */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
              
              {/* Badge Numéro (flottant) */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-[#ffcc00] text-black rounded-lg flex items-center justify-center font-black text-xl shadow-lg border border-white/20 rotate-3">
                {printingPlayer.jersey_number}
              </div>
            </div>

            {/* Info Section (Bas) */}
            <div className="px-3 pb-3 pt-1 z-10 shrink-0 relative">
              <div className="absolute top-0 right-3 -mt-6">
                 <span className="text-[8px] font-black uppercase tracking-widest bg-[#cc0000] text-white px-2 py-1 rounded-sm shadow-md">
                   {printingPlayer.position}
                 </span>
              </div>
              
              <h2 className="text-sm font-black uppercase tracking-tighter leading-none mb-1">
                {printingPlayer.full_name}
              </h2>
              <p className="text-[8px] font-bold text-[#ffcc00] uppercase tracking-widest flex items-center gap-1 mb-2">
                <MapPin className="w-2 h-2" /> {printingPlayer.team?.village || "Village Inconnu"}
              </p>

              <div className="bg-white/10 p-1.5 rounded-md border border-white/10 backdrop-blur-sm mt-1">
                <p className="text-[6px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Équipe</p>
                <p className="text-[9px] font-black uppercase text-white truncate">
                  {printingPlayer.team?.name || "Sans Équipe"}
                </p>
              </div>

              {/* Footer / ID */}
              <div className="mt-2 flex justify-between items-end border-t border-white/10 pt-1">
                <span className="text-[5px] font-mono text-gray-500 uppercase">ID:{printingPlayer.id.split('-')[0]}</span>
                <span className="text-[5px] font-black uppercase text-gray-400">Licence Joueur</span>
              </div>
            </div>
            
            {/* Déco */}
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#cc0000] rounded-full blur-2xl opacity-20 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
