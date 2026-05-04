"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  ExternalLink,
  Shield,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminDocumentsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchTeamsWithDocs();
  }, []);

  async function fetchTeamsWithDocs() {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, village, identity_docs_url, village_attestation_url, payment_receipt_url, status')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTeams(data);
    }
    setLoading(false);
  }

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.village.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'validated': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Vérification Documents</h1>
          <p className="text-muted text-sm">Contrôlez les pièces d'identité et justificatifs des équipes.</p>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-muted">{team.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <DocRow label="Pièces d'Identité (PDF)" url={team.identity_docs_url} />
              <DocRow label="Attestation de Village" url={team.village_attestation_url} />
              <DocRow label="Preuve de Paiement" url={team.payment_receipt_url} />
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
              <button className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Rejeter</button>
              <button className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all">Valider</button>
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
