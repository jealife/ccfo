"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Calendar, Users, Shield, Loader2, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTournamentConfig, updateTournamentConfig } from "@/app/api/tournaments/actions";

type Config = {
  name: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_teams: number | string;
  players_per_team: number | string;
  staff_per_team: number | string;
  is_active: boolean;
  points_win: number | string;
  points_draw: number | string;
  points_loss: number | string;
  qualification_spots: number | string;
};

const DEFAULT_CONFIG: Config = {
  name: "Coupe Cantonale Fieng Okano 2026",
  start_date: "2026-06-01",
  end_date: "2026-07-15",
  registration_deadline: "2026-05-01",
  max_teams: 32,
  players_per_team: 24,
  staff_per_team: 6,
  is_active: true,
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  qualification_spots: 4,
};

export default function AdminTournamentsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setIsLoading(true);
    const data = await getTournamentConfig();
    if (data) {
      setConfig({
        ...DEFAULT_CONFIG,
        ...data,
        start_date: data.start_date || DEFAULT_CONFIG.start_date,
        end_date: data.end_date || DEFAULT_CONFIG.end_date,
        registration_deadline: data.registration_deadline || DEFAULT_CONFIG.registration_deadline,
      });
    }
    setIsLoading(false);
  }

  async function handleSave() {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const result = await updateTournamentConfig({
      ...config,
      max_teams: Number(config.max_teams) || 0,
      players_per_team: Number(config.players_per_team) || 0,
      staff_per_team: Number(config.staff_per_team) || 0,
      points_win: Number(config.points_win) || 0,
      points_draw: Number(config.points_draw) || 0,
      points_loss: Number(config.points_loss) || 0,
      qualification_spots: Number(config.qualification_spots) || 0,
    });

    if (result.success) {
      setMessage({ type: 'success', text: "Paramètres mis à jour avec succès !" });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: "Erreur lors de la sauvegarde : " + result.error });
    }

    setIsSaving(false);
  }

  const set = (field: keyof Config, value: any) => setConfig(prev => ({ ...prev, [field]: value }));
  const setNum = (field: keyof Config, raw: string) => set(field, raw === "" ? "" : parseInt(raw) || 0);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted font-bold uppercase tracking-widest text-xs">Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Configuration du Tournoi</h1>
          <p className="text-muted text-sm">Gérez les paramètres globaux de la CCFO26.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {message && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold animate-slide-in",
              message.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all w-full sm:w-auto justify-center",
              isEditing ? "bg-primary text-white" : "bg-white text-primary"
            )}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? <Save className="w-4 h-4" /> : <Settings className="w-4 h-4" />)}
            {isSaving ? "Enregistrement..." : (isEditing ? "Confirmer les changements" : "Modifier la configuration")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Période & Dates */}
        <div className="sports-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black font-outfit uppercase">Période & Dates</h2>
          </div>
          <div className="space-y-4">
            <InputField
              label="Nom du Tournoi"
              value={config.name}
              onChange={(v: string) => set('name', v)}
              disabled={!isEditing}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Date de début"
                type="date"
                value={config.start_date}
                onChange={(v: string) => set('start_date', v)}
                disabled={!isEditing}
              />
              <InputField
                label="Date de fin"
                type="date"
                value={config.end_date}
                onChange={(v: string) => set('end_date', v)}
                disabled={!isEditing}
              />
            </div>
            <InputField
              label="Deadline Inscription"
              type="date"
              value={config.registration_deadline}
              onChange={(v: string) => set('registration_deadline', v)}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Règles & Quotas */}
        <div className="sports-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-black font-outfit uppercase">Règles & Quotas</h2>
          </div>
          <div className="space-y-4">
            <InputField
              label="Nombre max d'équipes"
              type="number"
              value={config.max_teams}
              onChange={(v: string) => setNum('max_teams', v)}
              disabled={!isEditing}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Joueurs par équipe"
                type="number"
                value={config.players_per_team}
                onChange={(v: string) => setNum('players_per_team', v)}
                disabled={!isEditing}
              />
              <InputField
                label="Staff par équipe"
                type="number"
                value={config.staff_per_team}
                onChange={(v: string) => setNum('staff_per_team', v)}
                disabled={!isEditing}
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Statut du Tournoi</p>
                <p className="text-xs text-muted">Active les inscriptions et les matchs.</p>
              </div>
              <button
                onClick={() => isEditing && set('is_active', !config.is_active)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black uppercase transition-all",
                  config.is_active
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20",
                  isEditing && "cursor-pointer hover:scale-105"
                )}
              >
                {config.is_active ? "Actif" : "Suspendu"}
              </button>
            </div>
          </div>
        </div>

        {/* Règles de Classement */}
        <div className="sports-card p-8 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-black font-outfit uppercase">Règles de Classement</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Points */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Barème de points</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 text-center">
                  <InputField
                    label="Victoire"
                    type="number"
                    value={config.points_win}
                    onChange={(v: string) => setNum('points_win', v)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-1 text-center">
                  <InputField
                    label="Nul"
                    type="number"
                    value={config.points_draw}
                    onChange={(v: string) => setNum('points_draw', v)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-1 text-center">
                  <InputField
                    label="Défaite"
                    type="number"
                    value={config.points_loss}
                    onChange={(v: string) => setNum('points_loss', v)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Live preview */}
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-6 text-xs">
                <span className="text-muted font-bold uppercase tracking-widest">Aperçu :</span>
                <span className="text-green-500 font-black">V = {config.points_win} pts</span>
                <span className="text-yellow-500 font-black">N = {config.points_draw} pts</span>
                <span className="text-red-500 font-black">D = {config.points_loss} pts</span>
              </div>
            </div>

            {/* Phase finale */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Qualification</p>
              <InputField
                label="Nombre d'équipes qualifiées pour la phase finale"
                type="number"
                value={config.qualification_spots}
                onChange={(v: string) => setNum('qualification_spots', v)}
                disabled={!isEditing}
              />
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 text-xs text-muted leading-relaxed">
                Les <span className="text-accent font-black">{config.qualification_spots} premières équipes</span> du classement
                seront mises en avant (fond coloré) et qualifiées pour la phase suivante.
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-muted space-y-1.5 leading-relaxed">
                <p className="font-bold text-foreground uppercase tracking-widest text-[10px]">Ordre de départage (à égalité de points)</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Différence de buts</li>
                  <li>Buts marqués</li>
                  <li>Ordre alphabétique</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-muted uppercase text-[10px] font-black tracking-widest">
          <Shield className="w-3 h-3" /> Note Technique
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Les colonnes <code className="text-primary font-bold">points_win</code>, <code className="text-primary font-bold">points_draw</code>,{" "}
          <code className="text-primary font-bold">points_loss</code> et <code className="text-primary font-bold">qualification_spots</code> doivent
          exister dans la table <code className="text-primary font-bold">tournament_config</code>. Les colonnes{" "}
          <code className="text-primary font-bold">goal_diff</code> et <code className="text-primary font-bold">position</code> doivent exister dans
          la table <code className="text-primary font-bold">standings</code>. Exécutez la migration SQL fournie si ce n'est pas encore fait.
        </p>
      </div>
    </div>
  );
}

function InputField({ label, value, type = "text", disabled, onChange }: {
  label: string;
  value: any;
  type?: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      />
    </div>
  );
}
