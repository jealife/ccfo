"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Lock,
  LockOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { TeamDetailModal } from "@/components/admin/TeamDetailModal";
import { AlertDialog } from "@/components/ui/Modal";
import { setRegistrationUnlocked, updateTeamStatus } from "@/app/api/teams/actions";
import type { TournamentConfig } from "@/lib/types";

type AdminTeam = {
  id: string;
  name: string;
  village: string | null;
  status: string;
  registration_unlocked?: boolean | null;
  players?: { count: number }[];
  staff?: { count: number }[];
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" | "warning"; onConfirm?: () => void; isConfirm?: boolean }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success"
  });
  const [selectedTeam, setSelectedTeam] = useState<AdminTeam | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const supabase = createClient();

  const filteredTeams = filter === "all" ? teams : teams.filter(t => t.status === filter);

  async function fetchTeams() {
    setLoading(true);
    
    const { data: configData } = await supabase.from('tournament_config').select('*').single();
    setConfig(configData);

    const { data } = await supabase
      .from('teams')
      .select(`
        *,
        players(count),
        staff(count)
      `);
    setTeams(data || []);
    setLoading(false);
  }

  useEffect(() => {
    const kickoff = setTimeout(fetchTeams, 0);
    return () => clearTimeout(kickoff);
    // chargement initial uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playersLimit = config?.players_per_team || 24;
  const staffLimit = config?.staff_per_team || 6;

  const handleStatusUpdate = async (teamId: string, newStatus: string) => {
    const actionLabel = newStatus === 'validated' ? "valider" : "rejeter";
    
    setAlert({
      isOpen: true,
      title: "Confirmation",
      message: `Voulez-vous vraiment ${actionLabel} cette équipe ?`,
      type: "warning",
      isConfirm: true,
      onConfirm: async () => {
        const result = await updateTeamStatus(teamId, newStatus);
        
        if (!result.success) {
          setAlert({
            isOpen: true,
            title: "Erreur",
            message: "Erreur lors de la mise à jour : " + result.error,
            type: "error"
          });
        } else {
          fetchTeams();
          setAlert({
            isOpen: true,
            title: "Succès",
            message: `L'équipe a été ${newStatus === 'validated' ? 'validée (paiement confirmé)' : 'rejetée'} avec succès.`,
            type: "success"
          });
        }
      }
    });
  };

  const handleToggleRosterLock = async (team: AdminTeam) => {
    const reopening = !team.registration_unlocked;
    setAlert({
      isOpen: true,
      title: reopening ? "Rouvrir l’effectif ?" : "Refiger l’effectif ?",
      message: reopening
        ? `${team.name} pourra de nouveau ajouter et retirer des joueurs et membres du staff. L’équipe reste validée et conserve son reçu.`
        : `${team.name} ne pourra plus modifier la composition de son effectif.`,
      type: "warning",
      isConfirm: true,
      onConfirm: async () => {
        const result = await setRegistrationUnlocked(team.id, reopening);
        if (!result.success) {
          setAlert({ isOpen: true, title: "Erreur", message: result.error || "Action impossible", type: "error" });
          return;
        }
        fetchTeams();
        setAlert({
          isOpen: true,
          title: "Succès",
          message: reopening
            ? "L’effectif est rouvert : le manager peut à nouveau le modifier."
            : "L’effectif est de nouveau figé.",
          type: "success",
        });
      },
    });
  };

  const stats = {
    total: teams?.length || 0,
    validated: teams?.filter(t => t.status === 'validated').length || 0,
    pending: teams?.filter(t => t.status === 'pending').length || 0,
    rejected: teams?.filter(t => t.status === 'rejected').length || 0,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit">Gestion des Équipes</h1>
          <p className="text-muted">Consultez et validez les inscriptions au tournoi.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {["all","validated","pending","rejected"].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f ? "bg-primary text-white" : "border border-border bg-card/50 hover:bg-card text-muted"
              }`}
            >
              {f === "all" ? "Tous" : f === "validated" ? "Validées" : f === "pending" ? "En attente" : "Rejetées"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusStatCard label="Total Équipes" value={stats.total.toString().padStart(2, '0')} icon={<Users />} color="blue" />
        <StatusStatCard label="Validées" value={stats.validated.toString().padStart(2, '0')} icon={<CheckCircle2 />} color="green" />
        <StatusStatCard label="En Attente" value={stats.pending.toString().padStart(2, '0')} icon={<Clock />} color="yellow" />
        <StatusStatCard label="Rejetées" value={stats.rejected.toString().padStart(2, '0')} icon={<XCircle />} color="red" />
      </div>

      {/* Teams Table - Desktop */}
      <div className="sports-card bg-card/30 backdrop-blur-xl border-white/5 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">Équipe</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">Joueurs/Staff</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">Statut</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(filteredTeams || []).map((team) => (
                <tr key={team.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm shrink-0">
                        {team.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{team.name}</div>
                        <div className="text-[10px] text-muted">{team.village}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2 w-28">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                          <span className="text-muted">J</span>
                          <span className={(team.players?.[0]?.count ?? 0) >= playersLimit ? "text-green-500" : "text-primary"}>{team.players?.[0]?.count || 0}/{playersLimit}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", (team.players?.[0]?.count ?? 0) >= playersLimit ? "bg-green-500" : "bg-primary")} style={{ width: `${Math.min(100, ((team.players?.[0]?.count || 0) / playersLimit) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                          <span className="text-muted">S</span>
                          <span className={(team.staff?.[0]?.count ?? 0) >= staffLimit ? "text-green-500" : "text-accent"}>{team.staff?.[0]?.count || 0}/{staffLimit}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", (team.staff?.[0]?.count ?? 0) >= staffLimit ? "bg-green-500" : "bg-accent")} style={{ width: `${Math.min(100, ((team.staff?.[0]?.count || 0) / staffLimit) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={team.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {team.status === 'pending' && (
                        <>
                          <button 
                            className="p-2 hover:bg-green-500/10 rounded-lg text-green-500 transition-colors" 
                            title="Valider" 
                            onClick={() => handleStatusUpdate(team.id, 'validated')}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors" 
                            title="Rejeter" 
                            onClick={() => handleStatusUpdate(team.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {['validated', 'locked'].includes(team.status) && (
                        <button
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            team.registration_unlocked
                              ? "text-yellow-500 hover:bg-yellow-500/10"
                              : "text-muted hover:bg-white/10 hover:text-yellow-500"
                          )}
                          title={team.registration_unlocked
                            ? "Effectif rouvert — cliquer pour le refiger"
                            : "Effectif figé — cliquer pour rouvrir l’accès au manager"}
                          onClick={() => handleToggleRosterLock(team)}
                        >
                          {team.registration_unlocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        className="p-2 hover:bg-white/10 rounded-lg text-primary transition-colors"
                        title="Voir les détails"
                        onClick={() => {
                          setSelectedTeam(team);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teams Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {(filteredTeams || []).map((team) => (
          <div key={team.id} className="sports-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold">{team.name[0]}</div>
                <div>
                  <div className="font-bold">{team.name}</div>
                  <div className="text-[10px] text-muted uppercase tracking-widest">{team.village}</div>
                </div>
              </div>
              <StatusBadge status={team.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted">Joueurs</span>
                  <span className={(team.players?.[0]?.count ?? 0) >= playersLimit ? "text-green-500" : "text-primary"}>{team.players?.[0]?.count || 0}/{playersLimit}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", (team.players?.[0]?.count ?? 0) >= playersLimit ? "bg-green-500" : "bg-primary")} style={{ width: `${Math.min(100, ((team.players?.[0]?.count || 0) / playersLimit) * 100)}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted">Staff</span>
                  <span className={(team.staff?.[0]?.count ?? 0) >= staffLimit ? "text-green-500" : "text-accent"}>{team.staff?.[0]?.count || 0}/{staffLimit}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", (team.staff?.[0]?.count ?? 0) >= staffLimit ? "bg-green-500" : "bg-accent")} style={{ width: `${Math.min(100, ((team.staff?.[0]?.count || 0) / staffLimit) * 100)}%` }} />
                </div>
              </div>
            </div>
            {team.status === 'pending' && (
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button 
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500/10 text-green-500 text-xs font-black uppercase" 
                  onClick={() => handleStatusUpdate(team.id, 'validated')}
                >
                  <CheckCircle2 className="w-4 h-4" /> Valider
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-black uppercase" 
                  onClick={() => handleStatusUpdate(team.id, 'rejected')}
                >
                  <XCircle className="w-4 h-4" /> Rejeter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onStatusUpdate={(teamId, status) => {
            setIsDetailModalOpen(false);
            handleStatusUpdate(teamId, status);
          }}
        />
      )}

      {/* Alert / Confirmation Dialog */}
      <AlertDialog
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        isConfirm={alert.isConfirm}
        onConfirm={alert.onConfirm}
        confirmLabel={alert.isConfirm ? (alert.title === "Confirmation" ? "Confirmer" : "OK") : "OK"}
      />
    </div>
  );
}

function StatusStatCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-green-500 bg-green-500/10",
    yellow: "text-yellow-500 bg-yellow-500/10",
    red: "text-red-500 bg-red-500/10",
  };

  return (
    <div className="sports-card p-6 bg-card/40 border-white/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</p>
          <h3 className="text-3xl font-black font-outfit mt-1">{value}</h3>
        </div>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    validated: { label: "Validé", color: "bg-green-500/10 text-green-500" },
    pending: { label: "En Attente", color: "bg-yellow-500/10 text-yellow-500" },
    incomplete: { label: "Incomplet", color: "bg-blue-500/10 text-blue-500" },
    rejected: { label: "Rejeté", color: "bg-red-500/10 text-red-500" },
    locked: { label: "Verrouillé", color: "bg-gray-500/10 text-gray-500" },
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase", config.color)}>
      {config.label}
    </span>
  );
}
