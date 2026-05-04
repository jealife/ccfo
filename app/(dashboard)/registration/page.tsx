"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Upload, 
  ChevronRight, 
  ChevronLeft,
  Info,
  Save,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { submitTeamRegistration } from "@/app/api/registration/actions";

export default function RegistrationPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Form State
  const [teamInfo, setTeamInfo] = useState({
    name: "",
    village: "",
    jersey_color: "",
    president_name: "",
    president_phone: "",
    whatsapp: "",
    email: ""
  });

  const [staff, setStaff] = useState(Array.from({ length: 6 }, () => ({
    last_name: "",
    first_name: "",
    nationality: "",
    role: "",
    origin_village: ""
  })));

  const [players, setPlayers] = useState(Array.from({ length: 24 }, (_, i) => ({
    jersey_number: (i + 1).toString(),
    full_name: "",
    birth_date: "",
    position: "",
    origin_village: ""
  })));

  const [documents, setDocuments] = useState({
    identity_docs: "",
    village_attestation: "",
    payment_receipt: ""
  });

  useEffect(() => {
    checkExistingTeam();
  }, []);

  async function checkExistingTeam() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teamData } = await supabase
      .from('teams')
      .select(`
        *,
        staff(*),
        players(*)
      `)
      .eq('manager_id', user.id)
      .single();

    if (teamData) {
      // Pre-fill state with existing data
      setTeamInfo({
        name: teamData.name || "",
        village: teamData.village || "",
        jersey_color: teamData.jersey_color || "",
        president_name: teamData.president_name || "",
        president_phone: teamData.president_phone || "",
        whatsapp: teamData.whatsapp || "",
        email: teamData.email || ""
      });

      if (teamData.staff && teamData.staff.length > 0) {
        const loadedStaff = Array.from({ length: 6 }, (_, i) => 
          teamData.staff[i] || { last_name: "", first_name: "", nationality: "", role: "", origin_village: "" }
        );
        setStaff(loadedStaff);
      }

      if (teamData.players && teamData.players.length > 0) {
        const loadedPlayers = Array.from({ length: 24 }, (_, i) => 
          teamData.players.find((p: any) => parseInt(p.jersey_number) === i + 1) || 
          { jersey_number: (i + 1).toString(), full_name: "", birth_date: "", position: "", origin_village: "" }
        );
        setPlayers(loadedPlayers);
      }

      setDocuments({
        identity_docs: teamData.identity_docs_url || "",
        village_attestation: teamData.village_attestation_url || "",
        payment_receipt: teamData.payment_receipt_url || ""
      });
    }
  }

  const steps = [
    { id: 1, title: "Général", icon: <Shield /> },
    { id: 2, title: "Staff", icon: <Users /> },
    { id: 3, title: "Joueurs", icon: <UserPlus /> },
    { id: 4, title: "Documents", icon: <FileText /> },
    { id: 5, title: "Paiement", icon: <CreditCard /> }
  ];

  const saveDraft = async () => {
    try {
      await submitTeamRegistration({
        teamInfo,
        staff,
        players,
        documents
      });
    } catch (error) {
      console.error("Erreur sauvegarde brouillon:", error);
    }
  };

  const handleNext = () => {
    saveDraft();
    setStep(s => Math.min(s + 1, 5));
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!agreed) {
      alert("Veuillez signer l'engagement pour continuer.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await submitTeamRegistration({
        teamInfo,
        staff,
        players,
        documents
      });

      if (result.success) {
        router.push("/dashboard?message=Inscription réussie ! Votre dossier est en cours de validation.");
      }
    } catch (error: any) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black font-outfit uppercase tracking-tighter">Inscription Officielle</h1>
        <p className="text-muted max-w-2xl mx-auto text-sm">Remplissez soigneusement les informations de votre équipe. Un dossier complet est requis pour la validation par le comité CCFO.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center max-w-3xl mx-auto px-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={cn(
              "w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 border-2 shadow-2xl",
              step === s.id ? "bg-primary border-primary text-white scale-110" :
              step > s.id ? "bg-green-500 border-green-500 text-white" : "bg-card border-white/5 text-muted"
            )}>
              {step > s.id ? <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" /> : <span className="scale-75 md:scale-100">{s.icon}</span>}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "w-6 md:w-12 h-0.5 mx-1 md:mx-2 transition-all duration-1000",
                step > s.id ? "bg-green-500" : "bg-white/5"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="glass-card p-5 md:p-10 pb-20 min-h-[500px] animate-fade-in relative overflow-hidden">
        {/* Step 1: General Info */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Nom de l'équipe" placeholder="Ex: Village Bissobinam" value={teamInfo.name} onChange={(v: string) => setTeamInfo({...teamInfo, name: v})} />
              <InputField label="Village" placeholder="Village d'origine" value={teamInfo.village} onChange={(v: string) => setTeamInfo({...teamInfo, village: v})} />
              <InputField label="Couleur du Maillot" placeholder="Ex: Vert et Jaune" value={teamInfo.jersey_color} onChange={(v: string) => setTeamInfo({...teamInfo, jersey_color: v})} />
              <InputField label="Nom du Président" placeholder="Ondo Samuel" value={teamInfo.president_name} onChange={(v: string) => setTeamInfo({...teamInfo, president_name: v})} />
              <InputField label="Téléphone" placeholder="+241 ..." value={teamInfo.president_phone} onChange={(v: string) => setTeamInfo({...teamInfo, president_phone: v})} />
              <InputField label="WhatsApp" placeholder="Numéro WhatsApp" value={teamInfo.whatsapp} onChange={(v: string) => setTeamInfo({...teamInfo, whatsapp: v})} />
            </div>
          </div>
        )}

        {/* Step 2: Staff */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-black uppercase text-sm tracking-widest text-primary flex items-center gap-2">
              <Users className="w-4 h-4" /> Les 6 Membres du Staff Technique
            </h3>
            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {staff.map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Membre {i + 1}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Nom</label>
                      <input 
                        value={s.last_name}
                        onChange={(e) => {
                          const newStaff = [...staff];
                          newStaff[i] = { ...newStaff[i], last_name: e.target.value };
                          setStaff(newStaff);
                        }}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Prénom</label>
                      <input 
                        value={s.first_name}
                        onChange={(e) => {
                          const newStaff = [...staff];
                          newStaff[i] = { ...newStaff[i], first_name: e.target.value };
                          setStaff(newStaff);
                        }}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Nationalité</label>
                      <input 
                        value={s.nationality}
                        onChange={(e) => {
                          const newStaff = [...staff];
                          newStaff[i] = { ...newStaff[i], nationality: e.target.value };
                          setStaff(newStaff);
                        }}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Fonction</label>
                      <input 
                        value={s.role}
                        onChange={(e) => {
                          const newStaff = [...staff];
                          newStaff[i] = { ...newStaff[i], role: e.target.value };
                          setStaff(newStaff);
                        }}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder={i === 0 ? "Coach" : i === 1 ? "Coach Adj" : "Fonction"} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Village Origine</label>
                      <input 
                        value={s.origin_village}
                        onChange={(e) => {
                          const newStaff = [...staff];
                          newStaff[i] = { ...newStaff[i], origin_village: e.target.value };
                          setStaff(newStaff);
                        }}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white/5 uppercase tracking-widest">
                  <tr>
                    <th className="p-4 border border-white/5">Nom</th>
                    <th className="p-4 border border-white/5">Prénom</th>
                    <th className="p-4 border border-white/5">Nationalité</th>
                    <th className="p-4 border border-white/5">Fonction</th>
                    <th className="p-4 border border-white/5">Village Origine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {staff.map((s, i) => (
                    <tr key={i}>
                      <td className="p-1 border border-white/5">
                        <input 
                          value={s.last_name}
                          onChange={(e) => {
                            const newStaff = [...staff];
                            newStaff[i] = { ...newStaff[i], last_name: e.target.value };
                            setStaff(newStaff);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="..." />
                      </td>
                      <td className="p-1 border border-white/5">
                        <input 
                          value={s.first_name}
                          onChange={(e) => {
                            const newStaff = [...staff];
                            newStaff[i] = { ...newStaff[i], first_name: e.target.value };
                            setStaff(newStaff);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="..." />
                      </td>
                      <td className="p-1 border border-white/5">
                        <input 
                          value={s.nationality}
                          onChange={(e) => {
                            const newStaff = [...staff];
                            newStaff[i] = { ...newStaff[i], nationality: e.target.value };
                            setStaff(newStaff);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="..." />
                      </td>
                      <td className="p-1 border border-white/5">
                        <input 
                          value={s.role}
                          onChange={(e) => {
                            const newStaff = [...staff];
                            newStaff[i] = { ...newStaff[i], role: e.target.value };
                            setStaff(newStaff);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder={i === 0 ? "Coach" : i === 1 ? "Coach Adj" : "Fonction"} />
                      </td>
                      <td className="p-1 border border-white/5">
                        <input 
                          value={s.origin_village}
                          onChange={(e) => {
                            const newStaff = [...staff];
                            newStaff[i] = { ...newStaff[i], origin_village: e.target.value };
                            setStaff(newStaff);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="..." />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Players */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-black uppercase text-sm tracking-widest text-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Les 24 Joueurs de l'Effectif
            </h3>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {players.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">{i + 1}</span>
                    <input 
                      value={p.full_name}
                      onChange={(e) => {
                        const newPlayers = [...players];
                        newPlayers[i] = { ...newPlayers[i], full_name: e.target.value };
                        setPlayers(newPlayers);
                      }}
                      className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Nom complet..." />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Naissance</label>
                      <input 
                        type="date" 
                        value={p.birth_date}
                        onChange={(e) => {
                          const newPlayers = [...players];
                          newPlayers[i] = { ...newPlayers[i], birth_date: e.target.value };
                          setPlayers(newPlayers);
                        }}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-2 text-xs outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Poste</label>
                      <select 
                        value={p.position}
                        onChange={(e) => {
                          const newPlayers = [...players];
                          newPlayers[i] = { ...newPlayers[i], position: e.target.value };
                          setPlayers(newPlayers);
                        }}
                        className="w-full bg-card border border-white/5 rounded-lg px-2 py-2 text-xs outline-none focus:border-primary">
                        <option value="">Poste</option>
                        <option value="GK">Gardien</option>
                        <option value="DEF">Défenseur</option>
                        <option value="MID">Milieu</option>
                        <option value="FWD">Attaquant</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Village Origine</label>
                      <input 
                        value={p.origin_village}
                        onChange={(e) => {
                          const newPlayers = [...players];
                          newPlayers[i] = { ...newPlayers[i], origin_village: e.target.value };
                          setPlayers(newPlayers);
                        }}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Village..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto h-[560px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white/5 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="p-4 border border-white/5 w-16">N°</th>
                    <th className="p-4 border border-white/5">Nom & Prénoms</th>
                    <th className="p-4 border border-white/5">Date Naissance</th>
                    <th className="p-4 border border-white/5">Poste</th>
                    <th className="p-4 border border-white/5">Village Origine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {players.map((p, i) => (
                    <tr key={i}>
                      <td className="p-1 border border-white/5">
                        <input 
                          value={p.jersey_number}
                          onChange={(e) => {
                            const newPlayers = [...players];
                            newPlayers[i] = { ...newPlayers[i], jersey_number: e.target.value };
                            setPlayers(newPlayers);
                          }}
                          className="w-full bg-transparent p-3 outline-none text-center font-black text-primary" placeholder={`${i+1}`} />
                      </td>
                      <td className="p-1 border border-white/5">
                        <input 
                          value={p.full_name}
                          onChange={(e) => {
                            const newPlayers = [...players];
                            newPlayers[i] = { ...newPlayers[i], full_name: e.target.value };
                            setPlayers(newPlayers);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="Nom complet..." />
                      </td>
                      <td className="p-1 border border-white/5">
                        <input 
                          type="date" 
                          value={p.birth_date}
                          onChange={(e) => {
                            const newPlayers = [...players];
                            newPlayers[i] = { ...newPlayers[i], birth_date: e.target.value };
                            setPlayers(newPlayers);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5" />
                      </td>
                      <td className="p-1 border border-white/5">
                        <select 
                          value={p.position}
                          onChange={(e) => {
                            const newPlayers = [...players];
                            newPlayers[i] = { ...newPlayers[i], position: e.target.value };
                            setPlayers(newPlayers);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5 appearance-none">
                          <option value="">Poste</option>
                          <option value="GK">Gardien</option>
                          <option value="DEF">Défenseur</option>
                          <option value="MID">Milieu</option>
                          <option value="FWD">Attaquant</option>
                        </select>
                      </td>
                      <td className="p-1 border border-white/5">
                        <input 
                          value={p.origin_village}
                          onChange={(e) => {
                            const newPlayers = [...players];
                            newPlayers[i] = { ...newPlayers[i], origin_village: e.target.value };
                            setPlayers(newPlayers);
                          }}
                          className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="Village..." />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full items-center">
            <DocUpload 
              label="Cartes d'identité / Actes de naissance" 
              desc="Un seul fichier PDF contenant toutes les pièces" 
              value={documents.identity_docs}
              onChange={(url) => setDocuments(prev => ({ ...prev, identity_docs: url }))}
            />
            <DocUpload 
              label="Attestation Chef de Village" 
              desc="Document signé par l'autorité locale" 
              value={documents.village_attestation}
              onChange={(url) => setDocuments(prev => ({ ...prev, village_attestation: url }))}
            />
            <DocUpload 
              label="Reçu de Paiement" 
              desc="Preuve du frais d'affiliation" 
              value={documents.payment_receipt}
              onChange={(url) => setDocuments(prev => ({ ...prev, payment_receipt: url }))}
            />
          </div>
        )}

        {/* Step 5: Engagement & Payment */}
        {step === 5 && (
          <div className="space-y-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-black font-outfit uppercase">Engagement Officiel</h3>
              <p className="text-muted text-sm max-w-lg">Je soussigné certifie l'exactitude des informations fournies et m'engage au respect du règlement général de la Coupe Cantonale Fieng Okano 2026.</p>
            </div>
            
            <label className="flex items-center gap-4 cursor-pointer p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-6 h-6 rounded accent-primary" />
              <span className="font-black uppercase tracking-widest text-xs italic">Je signe cet engagement numériquement</span>
            </label>

            <div className="w-full max-w-md p-8 rounded-xl bg-card border border-white/10 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Frais d'affiliation</span>
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="text-4xl font-black font-outfit text-white">150.000 FCFA</div>
              
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-left">
                <p className="text-[10px] text-primary font-bold leading-relaxed italic">
                  Note : Le paiement n'est pas obligatoire pour soumettre votre dossier, mais il est requis pour la validation finale par le comité.
                </p>
              </div>

              <button className="w-full py-4 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg shadow-primary/20">
                Payer via Airtel Money / Moov
              </button>
              
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Ou payez plus tard depuis votre dashboard</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between">
          <button 
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          
          {step < 5 ? (
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-all group"
            >
              Suivant <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20"
            >
              {isLoading ? "Traitement..." : "Finaliser le Dossier"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        {label}
      </label>
      <input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-primary/50 transition-all"
      />
    </div>
  );
}

function DocUpload({ label, desc, value, onChange }: { label: string, desc: string, value: string, onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `registration-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('team-docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('team-docs').getPublicUrl(filePath);
      onChange(publicUrl);
    } catch (error: any) {
      alert("Erreur upload : " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn(
      "p-8 rounded-xl bg-white/5 border-2 border-dashed flex flex-col items-center text-center space-y-4 transition-all group",
      value ? "border-green-500/50 bg-green-500/5" : "border-white/10 hover:border-primary/50"
    )}>
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
        value ? "bg-green-500/20 text-green-500" : "bg-secondary text-muted group-hover:text-primary"
      )}>
        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : value ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-black uppercase tracking-tight">{label}</div>
        <div className="text-[10px] text-muted font-medium">{desc}</div>
      </div>
      
      <label className="cursor-pointer">
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
          {uploading ? "Chargement..." : value ? "Modifier" : "Parcourir"}
        </div>
      </label>

      {value && (
        <a href={value} target="_blank" rel="noreferrer" className="text-[9px] text-primary font-bold hover:underline">
          Voir le document
        </a>
      )}
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

