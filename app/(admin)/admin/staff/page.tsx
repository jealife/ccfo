"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Printer,
  Shield,
  UserSquare2,
  FileText,
  Baby
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { StaffLicense } from "@/components/dashboard/StaffLicense";

type TeamOption = { id: string; name: string; village: string | null };
type StaffMember = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  origin_village: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  identity_docs_url: string | null;
  birth_certificate_url: string | null;
  teams: { name: string; village: string | null } | null;
};

/** Adapte une ligne `staff` au format attendu par la licence. */
function toLicenseMember(member: StaffMember) {
  return {
    id: member.id,
    firstName: member.first_name || "",
    lastName: member.last_name || "",
    team: member.teams?.name || "Équipe",
    role: member.role || "Staff",
    village: member.origin_village || member.teams?.village || "",
    nationality: member.nationality || "Gabonaise",
    dateOfBirth: member.date_of_birth,
    photoUrl: member.photo_url ?? undefined,
  };
}

export default function AdminStaffPage() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [printingMember, setPrintingMember] = useState<StaffMember | null>(null);
  const [printingAll, setPrintingAll] = useState(false);
  const supabase = createClient();

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('id, name, village')
      .eq('status', 'validated')
      .order('name', { ascending: true });
    setTeams(data || []);
  }

  async function fetchStaff() {
    setLoading(true);
    let query = supabase
      .from('staff')
      .select('*, teams(name, village)');
    
    if (selectedTeamId !== "all") {
      query = query.eq('team_id', selectedTeamId);
    }

    const { data } = await query.order('first_name', { ascending: true });
    setStaff(data || []);
    setLoading(false);
  }

  useEffect(() => {
    const kickoff = setTimeout(fetchTeams, 0);
    return () => clearTimeout(kickoff);
    // chargement initial uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const kickoff = setTimeout(fetchStaff, 0);
    return () => clearTimeout(kickoff);
    // fetchStaff dépend uniquement de selectedTeamId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId]);

  const filteredStaff = staff.filter(s => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Répertoire du Staff</h1>
          <p className="text-muted text-sm mt-1">Consultez les membres techniques de chaque club.</p>
        </div>
        
        <button
          onClick={() => setPrintingAll(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20 hover:scale-105 transition-all"
          title="Imprimer toutes les licences filtrées"
        >
          <Printer className="w-4 h-4" /> Imprimer les licences
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center bg-card/30 border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text"
            placeholder="Rechercher par nom ou fonction..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-accent transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select 
            className="flex-1 md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all text-sm"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
          >
            <option value="all">Toutes les équipes</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.village})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="sports-card h-24 bg-white/5 animate-pulse rounded-xl" />
          ))
        ) : filteredStaff.length > 0 ? (
          filteredStaff.map((member) => (
            <div key={member.id} className="sports-card p-4 flex items-center gap-4 bg-card/30 border-white/5 hover:border-accent/20 transition-all group relative overflow-hidden">
              <div className="relative w-14 h-14 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center text-xl font-black shadow-xl shrink-0 overflow-hidden">
                {member.photo_url ? (
                  <Image src={member.photo_url} alt={`${member.first_name ?? ""} ${member.last_name ?? ""}`} fill sizes="56px" className="object-cover" />
                ) : (
                  <UserSquare2 className="w-6 h-6 text-muted group-hover:text-accent transition-colors" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate group-hover:text-accent transition-colors">{member.first_name} {member.last_name}</h3>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/80">
                    {member.role || "Staff Technique"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent/60">
                    <Shield className="w-3 h-3" /> {member.teams?.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted mt-1 italic">
                    Village: {member.origin_village || "N/A"}
                  </div>
                </div>
              </div>

              {/* Actions — visibles sur mobile, au survol sur desktop */}
              <div className="absolute top-2 right-2 flex flex-col md:flex-row md:inset-0 items-end md:items-center justify-center gap-1.5 md:gap-3 md:bg-accent/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:backdrop-blur-[2px]">
                {member.identity_docs_url ? (
                  <a
                    href={member.identity_docs_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Voir la pièce d'identité"
                    aria-label="Voir la pièce d'identité"
                    className="p-2 md:px-4 md:py-2 rounded-xl bg-white/10 text-white font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-2 hover:scale-110 hover:bg-white/20 transition-all"
                  >
                    <FileText className="w-4 h-4" /> <span className="hidden md:inline">Pièce d&apos;Identité</span>
                  </a>
                ) : (
                  <span
                    title="Aucune pièce d'identité fournie"
                    className="p-2 md:px-4 md:py-2 rounded-xl bg-white/5 text-white/30 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" /> <span className="hidden md:inline">Aucune Pièce</span>
                  </span>
                )}
                {member.birth_certificate_url ? (
                  <a
                    href={member.birth_certificate_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Voir l'acte de naissance"
                    aria-label="Voir l'acte de naissance"
                    className="p-2 md:px-4 md:py-2 rounded-xl bg-white/10 text-white font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-2 hover:scale-110 hover:bg-white/20 transition-all"
                  >
                    <Baby className="w-4 h-4" /> <span className="hidden md:inline">Acte de Naissance</span>
                  </a>
                ) : (
                  <span
                    title="Aucun acte de naissance fourni"
                    className="p-2 md:px-4 md:py-2 rounded-xl bg-white/5 text-white/30 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 cursor-not-allowed"
                  >
                    <Baby className="w-4 h-4" /> <span className="hidden md:inline">Aucun Acte</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setPrintingMember(member)}
                  title="Imprimer la licence"
                  aria-label="Imprimer la licence"
                  className="p-2 md:px-4 md:py-2 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-2 hover:scale-110 transition-all"
                >
                  <Printer className="w-4 h-4" /> <span className="hidden md:inline">Imprimer Licence</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <Users className="w-12 h-12 text-muted/20 mx-auto" />
            <p className="text-muted italic">Aucun membre du staff trouvé pour cette sélection.</p>
          </div>
        )}
      </div>

      {/* Aperçu d'impression des licences */}
      {(printingMember || printingAll) && (
        <div className="fixed inset-0 z-100 bg-black/90 flex flex-col items-center gap-8 p-8 overflow-y-auto print-content backdrop-blur-md">
          <div className="flex items-center gap-4 sticky top-0 z-50 bg-black/50 p-4 rounded-2xl border border-white/10 backdrop-blur-md no-print">
            <button
              onClick={() => { setPrintingMember(null); setPrintingAll(false); }}
              className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest transition-all"
            >
              Fermer l’Aperçu
            </button>
            <button
              onClick={() => window.print()}
              className="px-8 py-2 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Confirmer l’Impression
            </button>
          </div>

          <div className="flex flex-col items-center gap-8 w-full max-w-4xl py-12">
            {printingAll ? (
              filteredStaff.map((m) => (
                <div key={m.id} className="break-after-page">
                  <StaffLicense member={toLicenseMember(m)} />
                </div>
              ))
            ) : printingMember && (
              <StaffLicense member={toLicenseMember(printingMember)} />
            )}
          </div>

          <style jsx global>{`
            @media print {
              .no-print { display: none !important; }
              body > *:not(.print-content) { display: none !important; }
              .print-content {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                display: block !important;
                background: white !important;
                z-index: 9999;
                padding: 0 !important;
                overflow: visible !important;
              }
              .break-after-page {
                page-break-after: always;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
