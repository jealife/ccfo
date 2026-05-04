"use client";

import { CreditCard, CheckCircle2, XCircle } from "lucide-react";

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Gestion des Paiements</h1>
          <p className="text-muted text-sm">Validez les frais d'affiliation des équipes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="sports-card p-6 bg-blue-500/10 border-blue-500/20">
          <p className="text-xs font-black uppercase text-blue-500">En Attente</p>
          <p className="text-3xl font-black font-outfit mt-2">0</p>
        </div>
        <div className="sports-card p-6 bg-green-500/10 border-green-500/20">
          <p className="text-xs font-black uppercase text-green-500">Validés</p>
          <p className="text-3xl font-black font-outfit mt-2">0 FCFA</p>
        </div>
        <div className="sports-card p-6 bg-red-500/10 border-red-500/20">
          <p className="text-xs font-black uppercase text-red-500">Rejetés</p>
          <p className="text-3xl font-black font-outfit mt-2">0</p>
        </div>
      </div>

      <div className="sports-card bg-card/30 backdrop-blur-xl border-white/5 overflow-hidden">
        <div className="py-20 text-center text-muted">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm italic">Module de vérification des paiements en construction.</p>
        </div>
      </div>
    </div>
  );
}
