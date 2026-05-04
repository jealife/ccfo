"use client";

import { FileText, Eye, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AdminDocumentsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Vérification Documents</h1>
          <p className="text-muted text-sm">Contrôlez les pièces d'identité et justificatifs.</p>
        </div>
      </div>

      <div className="sports-card bg-card/30 backdrop-blur-xl border-white/5 overflow-hidden">
        <div className="py-20 text-center text-muted">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm italic">Interface de revue documentaire en attente des premiers uploads.</p>
        </div>
      </div>
    </div>
  );
}
