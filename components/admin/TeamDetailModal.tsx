"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Users, 
  UserPlus, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Activity,
  Shield,
  Loader2,
  Printer
} from "lucide-react";
import { PlayerLicense } from "@/components/dashboard/PlayerLicense";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface TeamDetailModalProps {
  team: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (teamId: string, status: string) => void;
}

export function TeamDetailModal({ team, isOpen, onClose, onStatusUpdate }: TeamDetailModalProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"players" | "staff">("players");
  const [printingPlayer, setPrintingPlayer] = useState<any>(null);
  const [printingAll, setPrintingAll] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && team?.id) {
      fetchDetails();
    }
  }, [isOpen, team?.id]);

  async function fetchDetails() {
    setLoading(true);
    const [playersRes, staffRes] = await Promise.all([
      supabase.from('players').select('*').eq('team_id', team.id).order('jersey_number', { ascending: true }),
      supabase.from('staff').select('*').eq('team_id', team.id).order('created_at', { ascending: true })
    ]);
    
    setPlayers(playersRes.data || []);
    setStaff(staffRes.data || []);
    setLoading(false);
  }

  const handlePrint = (player: any) => {
    setPrintingPlayer(player);
  };

  const handleConfirmPrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-xl font-black shadow-xl">
              {team.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter">{team.name}</h2>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {team.village}</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {team.status}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-white/5 px-6">
          <button 
            onClick={() => setActiveTab("players")}
            className={cn(
              "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2",
              activeTab === "players" ? "border-primary text-primary" : "border-transparent text-muted hover:text-white"
            )}
          >
            Effectif Joueurs ({players.length})
          </button>
          <button 
            onClick={() => setActiveTab("staff")}
            className={cn(
              "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2",
              activeTab === "staff" ? "border-primary text-primary" : "border-transparent text-muted hover:text-white"
            )}
          >
            Staff Technique ({staff.length})
          </button>
          {activeTab === "players" && players.length > 0 && (
            <button 
              onClick={() => {
                setPrintingAll(true);
              }}
              className="ml-auto flex items-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-all"
            >
              <Printer className="w-4 h-4" /> Tout Imprimer
            </button>
          )}
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-linear-to-b from-transparent to-white/2">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs font-black uppercase tracking-widest">Chargement des données...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === "players" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {players.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted italic">Aucun joueur enregistré.</div>
                  ) : (
                    players.map((player) => (
                      <div key={player.id} className="sports-card p-3 flex items-center gap-4 bg-white/3 border-white/5 hover:border-primary/20 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-secondary border border-white/5 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                          {player.photo_url ? (
                            <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
                          ) : (
                            player.full_name[0]
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                              {player.jersey_number || "?"}
                            </span>
                            <span className="font-bold text-sm truncate">{player.full_name}</span>
                          </div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-muted mt-1">
                            {player.position || "Poste non défini"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-2 py-1 rounded bg-white/5 text-[8px] font-black uppercase tracking-widest text-muted">
                            ID: {player.id.slice(0, 5)}
                          </div>
                          <button 
                            onClick={() => handlePrint(player)}
                            className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors border border-primary/10"
                            title="Imprimer la licence"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {staff.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted italic">Aucun membre du staff enregistré.</div>
                  ) : (
                    staff.map((member) => (
                      <div key={member.id} className="sports-card p-3 flex items-center gap-4 bg-white/3 border-white/5 hover:border-accent/20 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-secondary border border-white/5 flex items-center justify-center font-bold text-lg shrink-0">
                          {member.full_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{member.full_name}</div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-muted mt-1">
                            {member.role || "Membre du Staff"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {member.origin || "Village"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-muted">Action Admin:</span>
             <div className="flex gap-2">
                <button 
                  onClick={() => onStatusUpdate(team.id, 'validated')}
                  disabled={team.status === 'validated'}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                    team.status === 'validated' 
                      ? "bg-green-500/10 text-green-500/40 cursor-not-allowed" 
                      : "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" /> Valider l'Équipe
                </button>
                <button 
                  onClick={() => onStatusUpdate(team.id, 'rejected')}
                  disabled={team.status === 'rejected'}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                    team.status === 'rejected' 
                      ? "bg-red-500/10 text-red-500/40 cursor-not-allowed" 
                      : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                  )}
                >
                  <XCircle className="w-4 h-4" /> Rejeter
                </button>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Fermer
          </button>
        </div>

      </div>

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
              Fermer l'Aperçu
            </button>
            <button 
              onClick={handleConfirmPrint}
              className="px-8 py-2 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Confirmer l'Impression
            </button>
          </div>

          <div className="flex flex-col items-center gap-8 w-full max-w-4xl py-12">
            {printingAll ? (
              players.map((p) => (
                <div key={p.id} className="break-after-page">
                  <PlayerLicense 
                    player={{
                      firstName: p.full_name.split(' ').slice(1).join(' ') || p.full_name,
                      lastName: p.full_name.split(' ')[0],
                      team: team.name,
                      number: p.jersey_number?.toString() || "00",
                      position: p.position || "Joueur",
                      village: team.village,
                      nationality: p.nationality || "Gabonaise",
                      photoUrl: p.photo_url,
                    }}
                  />
                </div>
              ))
            ) : (
              <PlayerLicense 
                player={{
                  firstName: printingPlayer.full_name.split(' ').slice(1).join(' ') || printingPlayer.full_name,
                  lastName: printingPlayer.full_name.split(' ')[0],
                  team: team.name,
                  number: printingPlayer.jersey_number?.toString() || "00",
                  position: printingPlayer.position || "Joueur",
                  village: team.village,
                  nationality: printingPlayer.nationality || "Gabonaise",
                  photoUrl: printingPlayer.photo_url,
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
