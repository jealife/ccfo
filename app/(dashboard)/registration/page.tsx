"use client";

import { useState } from "react";
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

  const [staff, setStaff] = useState(Array(6).fill({
    last_name: "",
    first_name: "",
    nationality: "",
    role: "",
    origin_village: ""
  }));

  const [players, setPlayers] = useState(Array(24).fill({
    jersey_number: "",
    full_name: "",
    birth_date: "",
    position: "",
    origin_village: ""
  }));

  const steps = [
    { id: 1, title: "Général", icon: <Shield /> },
    { id: 2, title: "Staff", icon: <Users /> },
    { id: 3, title: "Joueurs", icon: <UserPlus /> },
    { id: 4, title: "Documents", icon: <FileText /> },
    { id: 5, title: "Paiement", icon: <CreditCard /> }
  ];

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await submitTeamRegistration({
        teamInfo,
        staff,
        players
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
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center group">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 shadow-2xl",
              step === s.id ? "bg-primary border-primary text-white scale-110" : 
              step > s.id ? "bg-green-500 border-green-500 text-white" : "bg-card border-white/5 text-muted"
            )}>
              {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-2 transition-all duration-1000",
                step > s.id ? "bg-green-500" : "bg-white/5"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="glass-card p-10 min-h-[500px] animate-fade-in relative overflow-hidden">
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

        {/* Step 2: Staff Table */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="font-black uppercase text-sm tracking-widest text-primary flex items-center gap-2">
              <Users className="w-4 h-4" /> Les 6 Membres du Staff Technique
            </h3>
            <div className="overflow-x-auto">
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
                  {staff.map((_, i) => (
                    <tr key={i}>
                      <td className="p-1 border border-white/5"><input className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="..." /></td>
                      <td className="p-1 border border-white/5"><input className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="..." /></td>
                      <td className="p-1 border border-white/5"><input className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="..." /></td>
                      <td className="p-1 border border-white/5"><input className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder={i === 0 ? "Coach" : i === 1 ? "Coach Adj" : "Fonction"} /></td>
                      <td className="p-1 border border-white/5"><input className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="..." /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Players Table */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-black uppercase text-sm tracking-widest text-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Les 24 Joueurs de l'Effectif
            </h3>
            <div className="overflow-x-auto h-[600px]">
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
                  {players.map((_, i) => (
                    <tr key={i}>
                      <td className="p-1 border border-white/5"><input className="w-full bg-transparent p-3 outline-none text-center font-black text-primary" placeholder={`${i+1}`} /></td>
                      <td className="p-1 border border-white/5"><input className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="Nom complet..." /></td>
                      <td className="p-1 border border-white/5"><input type="date" className="w-full bg-transparent p-3 outline-none focus:bg-white/5" /></td>
                      <td className="p-1 border border-white/5">
                        <select className="w-full bg-transparent p-3 outline-none focus:bg-white/5 appearance-none">
                          <option value="">Poste</option>
                          <option value="GK">Gardien</option>
                          <option value="DEF">Défenseur</option>
                          <option value="MID">Milieu</option>
                          <option value="FWD">Attaquant</option>
                        </select>
                      </td>
                      <td className="p-1 border border-white/5"><input className="w-full bg-transparent p-3 outline-none focus:bg-white/5" placeholder="Village..." /></td>
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
            <DocUpload label="Cartes d'identité / Actes de naissance" desc="Un seul fichier PDF contenant toutes les pièces" />
            <DocUpload label="Attestation Chef de Village" desc="Document signé par l'autorité locale" />
            <DocUpload label="Reçu de Paiement" desc="Preuve du frais d'affiliation" />
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
              <input type="checkbox" className="w-6 h-6 rounded accent-primary" />
              <span className="font-black uppercase tracking-widest text-xs italic">Je signe cet engagement numériquement</span>
            </label>

            <div className="w-full max-w-md p-8 rounded-xl bg-linear-to-br from-primary to-accent border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Frais d'affiliation</span>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="text-4xl font-black font-outfit text-white">150.000 FCFA</div>
              <button className="w-full mt-6 py-4 rounded-xl bg-white text-primary font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">
                Payer maintenant
              </button>
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

function DocUpload({ label, desc }: any) {
  return (
    <div className="p-8 rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-all group">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted group-hover:text-primary transition-colors">
        <Upload className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-black uppercase tracking-tight">{label}</div>
        <div className="text-[10px] text-muted font-medium">{desc}</div>
      </div>
      <button className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
        Parcourir
      </button>
    </div>
  );
}
