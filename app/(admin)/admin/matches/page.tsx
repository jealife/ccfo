"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Activity,
  XCircle,
  Loader2,
  Shield,
  Trophy,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { AlertDialog } from "@/components/ui/Modal";
import { createMatch, deleteMatch } from "@/app/api/matches/actions";
import type { Match } from "@/lib/types";

// ── Structure du tournoi ──────────────────────────────────────
const PHASES = [
  { value: "Groupe A",      label: "Groupe A",      section: "group"   },
  { value: "Groupe B",      label: "Groupe B",      section: "group"   },
  { value: "Demi-finale 1", label: "Demi-finale 1", section: "knockout" },
  { value: "Demi-finale 2", label: "Demi-finale 2", section: "knockout" },
  { value: "Petite Finale", label: "Petite Finale", section: "knockout" },
  { value: "Grande Finale", label: "Grande Finale", section: "knockout" },
] as const;

type PhaseValue = (typeof PHASES)[number]["value"];

const SECTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  group:    { label: "Phase de Groupe",  icon: Shield, color: "text-primary"  },
  knockout: { label: "Phase Finale",     icon: Swords, color: "text-accent"   },
};

function phaseSection(v: string | null | undefined) {
  return PHASES.find((p) => p.value === v)?.section ?? "group";
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-accent/15 text-accent",
  live:      "bg-primary/15 text-primary animate-pulse",
  finished:  "bg-secondary text-muted border border-border",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programmé",
  live:      "En direct",
  finished:  "Terminé",
};

// ─────────────────────────────────────────────────────────────

type AdminMatchRow = Match & { group_name: string | null };
type TeamOption = { id: string; name: string };

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<AdminMatchRow[]>([]);
  const [teams,   setTeams]   = useState<TeamOption[]>([]);
  const [showForm,  setShowForm]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState<{
    home_team_id: string;
    away_team_id: string;
    match_date: string;
    venue: string;
    status: "scheduled" | "live" | "finished";
    group_name: PhaseValue;
  }>({
    home_team_id: "",
    away_team_id: "",
    match_date:   "",
    venue:        "Stade Municipal",
    status:       "scheduled",
    group_name:   "Groupe A",
  });

  const [alert, setAlert] = useState<{
    isOpen: boolean; title: string; message: string;
    type: "success" | "error" | "warning";
    onConfirm?: () => void; isConfirm?: boolean;
  }>({ isOpen: false, title: "", message: "", type: "success" });

  async function fetchData() {
    const [{ data: mData }, { data: tData }] = await Promise.all([
      supabase
        .from("matches")
        .select("*, home:teams!home_team_id(name), away:teams!away_team_id(name)")
        .order("match_date", { ascending: true }),
      supabase
        .from("teams")
        .select("id, name")
        .eq("status", "validated"),
    ]);
    setMatches(mData || []);
    setTeams(tData || []);
  }

  useEffect(() => {
    const kickoff = setTimeout(fetchData, 0);
    return () => clearTimeout(kickoff);
    // chargement initial uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.home_team_id === formData.away_team_id) {
      setAlert({ isOpen: true, title: "Sélection Invalide", message: "Une équipe ne peut pas s'affronter elle-même !", type: "warning" });
      return;
    }
    setIsLoading(true);
    const result = await createMatch(formData);
    if (!result.success) {
      setAlert({ isOpen: true, title: "Erreur", message: "Erreur lors de la création : " + result.error, type: "error" });
    } else {
      setShowForm(false);
      setFormData({ home_team_id: "", away_team_id: "", match_date: "", venue: "Stade Municipal", status: "scheduled", group_name: "Groupe A" });
      fetchData();
    }
    setIsLoading(false);
  };

  const handleDeleteMatch = (id: string) => {
    setAlert({
      isOpen: true, title: "Confirmation",
      message: "Supprimer ce match ? Le classement sera recalculé automatiquement.",
      type: "warning", isConfirm: true,
      onConfirm: async () => {
        const result = await deleteMatch(id);
        if (!result.success) {
          setAlert({ isOpen: true, title: "Erreur", message: result.error || "Erreur lors de la suppression.", type: "error" });
        } else { fetchData(); }
      },
    });
  };

  // Grouper les matchs par section (phase de groupe / phase finale)
  const groupMatches    = matches.filter((m) => phaseSection(m.group_name) === "group");
  const knockoutMatches = matches.filter((m) => phaseSection(m.group_name) === "knockout");

  return (
    <div className="space-y-10 pb-20 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Programmation des Matchs</h1>
          <p className="text-muted text-sm">2 poules de 4 équipes — demi-finales — petite et grande finale.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          {showForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Annuler" : "Programmer un Match"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="glass-card p-8 border-primary/20 bg-linear-to-br from-card to-primary/5 animate-slide-up">
          <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">

            {/* Phase */}
            <div className="space-y-2 lg:col-span-3 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Phase du Tournoi</label>
              <div className="flex flex-wrap gap-2">
                {PHASES.map((phase) => (
                  <button
                    key={phase.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, group_name: phase.value })}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                      formData.group_name === phase.value
                        ? phase.section === "knockout"
                          ? "bg-accent text-black border-accent"
                          : "bg-primary text-white border-primary"
                        : "bg-white/5 border-white/10 text-muted hover:border-white/20"
                    )}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Équipe domicile */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Équipe Domicile</label>
              <select
                required
                title="Équipe Domicile"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                value={formData.home_team_id}
                onChange={(e) => setFormData({ ...formData, home_team_id: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Équipe extérieur */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Équipe Extérieur</label>
              <select
                required
                title="Équipe Extérieur"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                value={formData.away_team_id}
                onChange={(e) => setFormData({ ...formData, away_team_id: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Date & heure */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Date & Heure</label>
              <input
                type="datetime-local"
                required
                title="Date et heure du match"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="lg:col-start-3 py-3.5 rounded-xl bg-white text-primary font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : "Confirmer le Match"}
            </button>
          </form>
        </div>
      )}

      {/* Listes par section */}
      {[
        { key: "group",    matchList: groupMatches    },
        { key: "knockout", matchList: knockoutMatches },
      ].map(({ key, matchList }) => {
        if (matchList.length === 0) return null;
        const meta = SECTION_META[key];
        const Icon = meta.icon;

        // Sous-grouper par phase
        const byPhase: Record<string, AdminMatchRow[]> = {};
        for (const m of matchList) {
          const phase = m.group_name || "—";
          if (!byPhase[phase]) byPhase[phase] = [];
          byPhase[phase].push(m);
        }

        return (
          <section key={key} className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className={cn("w-5 h-5", meta.color)} />
              <h2 className="text-lg font-black font-outfit uppercase tracking-tight">{meta.label}</h2>
            </div>

            {Object.entries(byPhase).map(([phase, phaseMatches]) => (
              <div key={phase} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Trophy className="w-3.5 h-3.5 text-muted" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">{phase}</span>
                  <span className="text-[10px] text-muted/50">({phaseMatches.length} match{phaseMatches.length > 1 ? "s" : ""})</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {phaseMatches.map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      onDelete={() => handleDeleteMatch(match.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      {matches.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <Calendar className="w-12 h-12 text-muted/20 mx-auto" />
          <p className="text-muted italic">Aucun match programmé pour le moment.</p>
        </div>
      )}

      <AlertDialog
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        isConfirm={alert.isConfirm}
        onConfirm={alert.onConfirm}
      />
    </div>
  );
}

/* ── Ligne match ── */
function MatchRow({ match, onDelete }: { match: Match; onDelete: () => void }) {
  const matchDate = new Date(match.match_date);

  return (
    <div className="sports-card p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 flex-1 w-full">

        {/* Date */}
        <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto md:border-r border-white/5 md:pr-6 min-w-[90px] bg-white/5 md:bg-transparent p-3 md:p-0 rounded-xl shrink-0">
          <span className="text-sm font-black font-outfit text-primary">
            {matchDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
          </span>
          <span className="text-[10px] font-bold text-muted uppercase">
            {matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Équipes */}
        <div className="flex-1 flex items-center justify-between gap-2 w-full">
          <div className="flex-1 flex items-center justify-end gap-2">
            <span className="font-bold text-sm text-right leading-tight">{match.home?.name}</span>
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm shrink-0">
              {match.home?.name?.[0]}
            </div>
          </div>

          <div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 shrink-0">
            {match.status === "finished"
              ? <span className="text-sm font-black tabular-nums">{match.home_score} – {match.away_score}</span>
              : <span className="text-[10px] font-black uppercase tracking-widest text-primary/50">VS</span>
            }
          </div>

          <div className="flex-1 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm shrink-0">
              {match.away?.name?.[0]}
            </div>
            <span className="font-bold text-sm leading-tight">{match.away?.name}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0 md:pl-6 md:border-l border-white/5">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
          STATUS_STYLES[match.status] || STATUS_STYLES.scheduled
        )}>
          {STATUS_LABELS[match.status] || match.status}
        </span>
        <button type="button" onClick={onDelete} title="Supprimer ce match" className="p-2 text-muted hover:text-red-500 transition-colors">
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
  );
}
