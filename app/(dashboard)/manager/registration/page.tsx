"use client";

import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { ShieldAlert } from "lucide-react";

export default function RegistrationPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-black font-outfit uppercase tracking-tight">Inscription de l'Équipe</h1>
        <p className="text-muted">
          Veuillez remplir soigneusement toutes les étapes ci-dessous. Une fois soumis, votre dossier sera examiné par l'administration du tournoi.
        </p>
        
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/20 text-accent text-sm text-left">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p>
            <b>Date Limite :</b> L'inscription doit être complétée au plus tard 1 mois avant le début du tournoi. Après cette date, le système sera verrouillé.
          </p>
        </div>
      </div>

      <RegistrationForm />
    </div>
  );
}
