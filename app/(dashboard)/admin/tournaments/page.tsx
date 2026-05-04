"use client";

import { useState } from "react";
import { Settings, Save, Calendar, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminTournamentsPage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Configuration du Tournoi</h1>
          <p className="text-muted text-sm">Gérez les paramètres globaux de la CCFO.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all",
            isEditing ? "bg-green-500 text-white" : "bg-white text-primary"
          )}
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          {isEditing ? "Enregistrer" : "Modifier"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="sports-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black font-outfit uppercase">Période & Dates</h2>
          </div>
          <div className="space-y-4">
            <InputField label="Nom du Tournoi" value="Coupe Cantonale Fieng Okano 2026" disabled={!isEditing} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Date de début" type="date" value="2026-06-01" disabled={!isEditing} />
              <InputField label="Date de fin" type="date" value="2026-07-15" disabled={!isEditing} />
            </div>
            <InputField label="Deadline Inscription" type="date" value="2026-05-01" disabled={!isEditing} />
          </div>
        </div>

        <div className="sports-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-black font-outfit uppercase">Règles & Quotas</h2>
          </div>
          <div className="space-y-4">
            <InputField label="Nombre max d'équipes" type="number" value="32" disabled={!isEditing} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Joueurs requis" type="number" value="24" disabled={!isEditing} />
              <InputField label="Staff requis" type="number" value="6" disabled={!isEditing} />
            </div>
            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Statut du Tournoi</p>
                <p className="text-xs text-muted">Active les inscriptions et les matchs.</p>
              </div>
              <div className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase", isEditing ? "bg-green-500/20 text-green-500 cursor-pointer" : "bg-primary/20 text-primary")}>
                Actif
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, type = "text", disabled }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</label>
      <input 
        type={type} 
        defaultValue={value} 
        disabled={disabled}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
