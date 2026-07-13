"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { updateTeamStatus } from "@/app/api/teams/actions";

type DocTeam = {
  id: string;
  name: string;
  village: string | null;
  identity_docs_url: string | null;
  village_attestation_url: string | null;
  payment_receipt_url: string | null;
  status: string;
};

export default function AdminDocumentsPage() {
  const [teams, setTeams] = useState<DocTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirm, setConfirm] = useState<{ teamId: string; action: "validated" | "rejected"; teamName: string } | null>(null);
  const supabase = createClient();

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function fetchTeamsWithDocs() {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, village, identity_docs_url, village_attestation_url, payment_receipt_url, status')
        .order('created_at', { ascending: false });

      if (!error && data) setTeams(data);
      setLoading(false);
    }
    fetchTeamsWithDocs();
    // chargement initial uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAction(teamId: string, action: "validated" | "rejected") {
    setProcessingId(teamId);
    setConfirm(null);
    const result = await updateTeamStatus(teamId, action);
    setProcessingId(null);

    if (result.success) {
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: action } : t));
      showToast(
        action === "validated" ? "Dossier validé avec succès." : "Dossier rejeté.",
        "success"
      );
    } else {
      showToast("Erreur : " + result.error, "error");
    }
  }

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.village ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'validated': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const docsComplete = (team: DocTeam | undefined) =>
    !!team && !!team.identity_docs_url && !!team.village_attestation_url && !!team.payment_receipt_url;

  return (
    <div className="space-y-8 animate-fade-in pb-20">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold animate-fade-in",
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Confirmation overlay */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", confirm.action === "validated" ? "bg-green-500/10" : "bg-red-500/10")}>
                <AlertTriangle className={cn("w-6 h-6", confirm.action === "validated" ? "text-green-500" : "text-red-500")} />
              </div>
              <div>
                <h3 className="font-black text-lg">{confirm.action === "validated" ? "Valider" : "Rejeter"} ce dossier ?</h3>
                <p className="text-sm text-muted">{confirm.teamName}</p>
              </div>
            </div>
            {confirm.action === "validated" && !docsComplete(teams.find(t => t.id === confirm.teamId)) && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Certains documents sont manquants. Continuer quand même ?
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm font-bold hover:bg-white/10 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => handleAction(confirm.teamId, confirm.action)}
                className={cn("flex-1 py-2.5 rounded-xl text-sm font-black transition-colors", confirm.action === "validated" ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600")}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Vérification Documents</h1>
          <p className="text-muted text-sm">Contrôlez les pièces d’identité et justificatifs des équipes.</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une équipe..."
            className="w-full md:w-80 bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Dossiers complets", count: teams.filter(docsComplete).length, color: "text-green-500 bg-green-500/10" },
          { label: "Incomplets", count: teams.filter(t => !docsComplete(t)).length, color: "text-yellow-500 bg-yellow-500/10" },
          { label: "Validés", count: teams.filter(t => t.status === "validated").length, color: "text-primary bg-primary/10" },
        ].map(s => (
          <div key={s.label} className="sports-card p-4 bg-card/30 border-white/5 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg", s.color)}>{s.count}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted font-medium">Chargement des dossiers...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="col-span-2 py-20 text-center sports-card">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-muted italic">Aucun dossier documentaire trouvé.</p>
          </div>
        ) : filteredTeams.map((team) => (
          <div key={team.id} className="sports-card bg-card/30 backdrop-blur-xl border-white/5 p-6 space-y-6 hover:border-primary/20 transition-all group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-black text-xl text-primary group-hover:scale-110 transition-transform">
                  {team.name[0]}
                </div>
                <div>
                  <h3 className="font-black font-outfit uppercase tracking-tight text-lg">{team.name}</h3>
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest">{team.village}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                {getStatusIcon(team.status)}
                <span className="text-[9px] font-black uppercase tracking-widest text-muted">
                  {team.status === "validated" ? "Validé" : team.status === "rejected" ? "Rejeté" : "En attente"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <DocRow label="Pièces d'Identité (PDF)" url={team.identity_docs_url ?? undefined} />
              <DocRow label="Attestation de Village" url={team.village_attestation_url ?? undefined} />
              <DocRow label="Preuve de Paiement" url={team.payment_receipt_url ?? undefined} />
            </div>

            {!docsComplete(team) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-500/80 text-[10px] font-black uppercase tracking-widest">
                <AlertTriangle className="w-3.5 h-3.5" /> Documents incomplets
              </div>
            )}

            <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
              {processingId === team.id ? (
                <div className="flex items-center gap-2 text-muted text-xs font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" /> Traitement...
                </div>
              ) : (
                <>
                  {team.status !== 'rejected' && (
                    <button
                      onClick={() => setConfirm({ teamId: team.id, action: "rejected", teamName: team.name })}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Rejeter
                    </button>
                  )}
                  {team.status !== 'validated' && (
                    <button
                      onClick={() => setConfirm({ teamId: team.id, action: "validated", teamName: team.name })}
                      className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all"
                    >
                      Valider
                    </button>
                  )}
                  {team.status === 'validated' && (
                    <span className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Validé
                    </span>
                  )}
                  {team.status === 'rejected' && (
                    <span className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5" /> Rejeté
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocRow({ label, url }: { label: string, url?: string }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10 opacity-60">
        <span className="text-[10px] font-black uppercase tracking-widest text-red-500/80">{label}</span>
        <span className="text-[9px] font-bold text-red-500 italic">Manquant</span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 transition-all group/row"
    >
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <ExternalLink className="w-3 h-3 text-muted group-hover/row:text-primary transition-colors" />
    </a>
  );
}
