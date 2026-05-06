"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Calendar, Users, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTournamentConfig, updateTournamentConfig } from "@/app/api/tournaments/actions";

export default function AdminTournamentsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [config, setConfig] = useState({
    name: "Coupe Cantonale Fieng Okano 2026",
    start_date: "2026-06-01",
    end_date: "2026-07-15",
    registration_deadline: "2026-05-01",
    max_teams: 32,
    players_per_team: 24,
    staff_per_team: 6,
    is_active: true
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setIsLoading(true);
    const data = await getTournamentConfig();
    if (data) {
      // Format dates for input type="date"
      const formattedData = {
        ...data,
        start_date: data.start_date || "2026-06-01",
        end_date: data.end_date || "2026-07-15",
        registration_deadline: data.registration_deadline || "2026-05-01"
      };
      setConfig(formattedData);
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
    
    const result = await updateTournamentConfig(config);
    
    if (result.success) {
      setMessage({ type: 'success', text: "Paramètres mis à jour avec succès !" });
      setIsEditing(false);
      // Clear message after 3s
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: "Erreur lors de la sauvegarde : " + result.error });
    }
    
    setIsSaving(false);
  }

  const handleChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

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
          <p className="text-muted text-sm">Gérez les paramètres globaux de la CCFO.</p>
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
              onChange={(v: string) => handleChange('name', v)}
              disabled={!isEditing} 
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Date de début" 
                type="date" 
                value={config.start_date} 
                onChange={(v: string) => handleChange('start_date', v)}
                disabled={!isEditing} 
              />
              <InputField 
                label="Date de fin" 
                type="date" 
                value={config.end_date} 
                onChange={(v: string) => handleChange('end_date', v)}
                disabled={!isEditing} 
              />
            </div>
            <InputField 
              label="Deadline Inscription" 
              type="date" 
              value={config.registration_deadline} 
              onChange={(v: string) => handleChange('registration_deadline', v)}
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
              onChange={(v: string) => handleChange('max_teams', v === "" ? "" : parseInt(v) || 0)}
              disabled={!isEditing} 
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Joueurs par équipe" 
                type="number" 
                value={config.players_per_team} 
                onChange={(v: string) => handleChange('players_per_team', v === "" ? "" : parseInt(v) || 0)}
                disabled={!isEditing} 
              />
              <InputField 
                label="Staff par équipe" 
                type="number" 
                value={config.staff_per_team} 
                onChange={(v: string) => handleChange('staff_per_team', v === "" ? "" : parseInt(v) || 0)}
                disabled={!isEditing} 
              />
            </div>
            
            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Statut du Tournoi</p>
                <p className="text-xs text-muted">Active les inscriptions et les matchs.</p>
              </div>
              <button 
                onClick={() => isEditing && handleChange('is_active', !config.is_active)}
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
      </div>
      
      {/* SQL Warning/Tip for User */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-muted uppercase text-[10px] font-black tracking-widest">
          <Shield className="w-3 h-3" /> Note Technique
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Cette page est désormais connectée à la table <code className="text-primary font-bold">tournament_config</code> dans Supabase. 
          Assurez-vous que cette table existe avec les colonnes correspondantes pour que les données persistent.
        </p>
      </div>
    </div>
  );
}

function InputField({ label, value, type = "text", disabled, onChange }: any) {
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

