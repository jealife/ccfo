"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  FileText,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitTeamRegistration } from "@/app/api/registration/actions";
import { createClient } from "@/lib/supabase/client";
import { AlertDialog } from "@/components/ui/Modal";
import type { TournamentConfig } from "@/lib/types";
import Link from "next/link";

type TeamFormState = { name: string; village: string; color: string; president: string; phone: string; whatsapp: string; email: string };
type StaffFormState = { name: string; role: string; origin: string };
type PlayerFormState = { name: string; number: string; dob: string; position: string; village: string };
type DocumentsFormState = { idCards: string | null; certificate: string | null; receipt: string | null };
type FormState = {
  team: TeamFormState;
  staff: StaffFormState[];
  players: PlayerFormState[];
  documents: DocumentsFormState;
};
type InputChange = React.ChangeEvent<HTMLInputElement>;

const STEPS = [
  { id: 1, title: "Équipe", icon: <Users className="w-5 h-5" /> },
  { id: 2, title: "Staff", icon: <UserPlus className="w-5 h-5" /> },
  { id: 3, title: "Joueurs", icon: <Users className="w-4 h-4" /> },
  { id: 4, title: "Documents", icon: <FileText className="w-5 h-5" /> },
  { id: 5, title: "Paiement", icon: <CreditCard className="w-5 h-5" /> },
];

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: "error" | "warning" | "info" }>({
    isOpen: false, title: "", message: "", type: "info"
  });

  const showAlert = (title: string, message: string, type: "error" | "warning" | "info" = "warning") =>
    setAlertDialog({ isOpen: true, title, message, type });
  
  const [formData, setFormData] = useState<FormState>({
    team: { name: "", village: "", color: "", president: "", phone: "", whatsapp: "", email: "" },
    staff: Array(6).fill({ name: "", role: "", origin: "" }),
    players: Array(24).fill({ name: "", number: "", dob: "", position: "", village: "" }),
    documents: { idCards: null, certificate: null, receipt: null }
  });

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Load Tournament Config
      const { data: configData } = await supabase.from('tournament_config').select('*').single();
      if (!configData) return;
      setConfig(configData);

      const pLimit = configData.players_per_team || 24;
      const sLimit = configData.staff_per_team || 6;

      // 2. Load Existing Team
      const { data: teamData } = await supabase.from('teams').select('*').eq('manager_id', user.id).maybeSingle();
      
      if (teamData) {
        // 3. Load Existing Staff & Players
        const { data: staffData } = await supabase.from('staff').select('*').eq('team_id', teamData.id);
        const { data: playersData } = await supabase.from('players').select('*').eq('team_id', teamData.id).order('created_at', { ascending: true });

        // Map existing staff into fixed-size array
        const mappedStaff = Array(sLimit).fill({ name: "", role: "", origin: "" });
        staffData?.forEach((s, i) => {
          if (i < sLimit) mappedStaff[i] = { name: `${s.first_name} ${s.last_name}`, role: s.role, origin: s.origin_village || "" };
        });

        // Map existing players into fixed-size array
        const mappedPlayers = Array(pLimit).fill({ name: "", number: "", dob: "", position: "", village: "" });
        playersData?.forEach((p, i) => {
          if (i < pLimit) mappedPlayers[i] = { name: p.full_name, number: String(p.jersey_number ?? ""), dob: p.date_of_birth || "", position: p.position || "", village: p.origin_village || "" };
        });

        setFormData({
          team: {
            name: teamData.name || "",
            village: teamData.village || "",
            color: teamData.jersey_color || "",
            president: teamData.president_name || "",
            phone: teamData.president_phone || "",
            whatsapp: teamData.whatsapp || "",
            email: teamData.email || ""
          },
          staff: mappedStaff,
          players: mappedPlayers,
          documents: {
            idCards: teamData.identity_docs_url || null,
            certificate: teamData.village_attestation_url || null,
            receipt: teamData.payment_receipt_url || null
          }
        });

        // If team is already validated or complete, show success
        if (teamData.status === 'validated' || (staffData?.length === sLimit && playersData?.length === pLimit)) {
          setIsSuccess(true);
        }
      } else {
        // Default empty arrays if no team exists yet
        setFormData(prev => ({
          ...prev,
          staff: Array(sLimit).fill({ name: "", role: "", origin: "" }),
          players: Array(pLimit).fill({ name: "", number: "", dob: "", position: "", village: "" }),
        }));
      }
    }
    loadData();
  }, []);

  const playersLimit = config?.players_per_team || 24;
  const staffLimit = config?.staff_per_team || 6;

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!formData.team.name || !formData.team.village || !formData.team.president || !formData.team.phone) {
        showAlert("Champs manquants", "Veuillez remplir les informations obligatoires de l'équipe : Nom, Village, Président et Téléphone.");
        return;
      }
    }
    if (currentStep === 2) {
      const validStaff = formData.staff.filter(s => s.name.trim() !== "");
      if (validStaff.length < staffLimit) {
        showAlert("Staff incomplet", `Vous devez enregistrer exactement ${staffLimit} membres du staff pour continuer.`);
        return;
      }
    }
    if (currentStep === 3) {
      const validPlayers = formData.players.filter(p => p.name.trim() !== "");
      if (validPlayers.length < playersLimit) {
        showAlert("Liste incomplète", `Le règlement exige ${playersLimit} joueurs. Il vous en manque ${playersLimit - validPlayers.length}.`);
        return;
      }
    }

    if (currentStep === STEPS.length) {
      await handleSubmit();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Transforme l'état du formulaire vers le schéma partagé (lib/validation/registration)
      const result = await submitTeamRegistration({
        teamInfo: {
          name: formData.team.name,
          village: formData.team.village,
          jersey_color: formData.team.color,
          president_name: formData.team.president,
          president_phone: formData.team.phone,
          whatsapp: formData.team.whatsapp,
          email: formData.team.email,
        },
        staff: formData.staff
          .filter((s) => s.name.trim())
          .map((s) => ({ full_name: s.name.trim(), role: s.role, origin_village: s.origin })),
        players: formData.players
          .filter((p) => p.name.trim())
          .map((p) => ({
            full_name: p.name.trim(),
            jersey_number: p.number,
            position: p.position,
            date_of_birth: p.dob,
            origin_village: p.village,
          })),
        documents: {
          identity_docs: formData.documents.idCards,
          village_attestation: formData.documents.certificate,
          payment_receipt: formData.documents.receipt,
        },
      });
      if (result.success) {
        setIsSuccess(true);
      } else {
        showAlert("Erreur", result.error || "Erreur lors de l'inscription. Veuillez réessayer.", "error");
      }
    } catch {
      showAlert("Erreur", "Une erreur imprévue est survenue. Veuillez réessayer.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sports-card p-12 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black font-outfit uppercase">Félicitations !</h2>
        <p className="text-muted text-lg max-w-md mx-auto">
          Votre inscription a été soumise avec succès. L’administration va examiner votre dossier dans les plus brefs délais.
        </p>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="px-8 py-3 rounded-xl bg-primary text-background font-bold hover:scale-105 transition-all">
            Aller au Dashboard
          </Link>
          <Link href="/" className="px-8 py-3 rounded-xl border border-border font-bold hover:bg-white/5 transition-all">
            Retour à l’accueil
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="mb-12 flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
        {STEPS.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
            <div 
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                currentStep >= step.id 
                  ? "bg-primary border-primary text-white" 
                  : "bg-background border-border text-muted"
              )}
            >
              {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.icon}
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              currentStep >= step.id ? "text-primary" : "text-muted"
            )}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="sports-card p-8 bg-card/40 backdrop-blur-xl border-white/5 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {currentStep === 1 && <TeamStep data={formData.team} updateData={(val) => setFormData({...formData, team: {...formData.team, ...val}})} />}
            {currentStep === 2 && <StaffStep data={formData.staff} limit={staffLimit} updateData={(index, val) => {
              const newStaff = [...formData.staff];
              newStaff[index] = {...newStaff[index], ...val};
              setFormData({...formData, staff: newStaff});
            }} />}
            {currentStep === 3 && <PlayersStep data={formData.players} limit={playersLimit} updateData={(index, val) => {
              const newPlayers = [...formData.players];
              newPlayers[index] = {...newPlayers[index], ...val};
              setFormData({...formData, players: newPlayers});
            }} />}
            {currentStep === 4 && <DocumentsStep data={formData.documents} updateData={(val) => setFormData({...formData, documents: {...formData.documents, ...val}})} teamName={formData.team.name} />}
            {currentStep === 5 && <PaymentStep data={formData.team} updateData={(val) => setFormData({...formData, documents: {...formData.documents, ...val}})} receiptData={formData.documents.receipt} />}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border font-bold text-muted hover:text-foreground disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour
          </button>
          
          <button
            onClick={nextStep}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                {currentStep === STEPS.length ? "Soumettre" : "Suivant"}
                {currentStep !== STEPS.length && <ChevronRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}

function TeamStep({ data, updateData }: {
  data: TeamFormState;
  updateData: (val: Partial<TeamFormState>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black font-outfit">Informations de l’Équipe</h2>
          <p className="text-muted text-sm">Détails officiels de votre club</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput label="Nom de l'équipe" placeholder="ex: Village Bissobinam" value={data.name} onChange={(e: InputChange) => updateData({name: e.target.value})} />
        <FormInput label="Village / Quartier d'origine" placeholder="ex: Okano Central" value={data.village} onChange={(e: InputChange) => updateData({village: e.target.value})} />
        <FormInput label="Couleur du maillot principal" placeholder="ex: Vert et Jaune" value={data.color} onChange={(e: InputChange) => updateData({color: e.target.value})} />
        <FormInput label="Président / Représentant" placeholder="Ondo Samuel" value={data.president} onChange={(e: InputChange) => updateData({president: e.target.value})} />
        <FormInput label="Téléphone" placeholder="+241 ..." value={data.phone} onChange={(e: InputChange) => updateData({phone: e.target.value})} />
        <FormInput label="WhatsApp" placeholder="+241 ..." value={data.whatsapp} onChange={(e: InputChange) => updateData({whatsapp: e.target.value})} />
      </div>
    </div>
  );
}

function StaffStep({ data, updateData, limit }: {
  data: StaffFormState[];
  updateData: (index: number, val: Partial<StaffFormState>) => void;
  limit: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black font-outfit">Staff Technique</h2>
          <p className="text-muted text-sm">Exactement {limit} membres requis</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-black uppercase">
          Requis: {limit} / Actuel: {data.filter((s) => s.name).length}
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((member, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-white/5 flex gap-4 items-end">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label={`Nom Membre ${i + 1}`} placeholder="Nom complet" value={member.name} onChange={(e: InputChange) => updateData(i, {name: e.target.value})} />
                <FormInput label="Rôle" placeholder="Coach, Assistant, etc." value={member.role} onChange={(e: InputChange) => updateData(i, {role: e.target.value})} />
                <FormInput label="Origine" placeholder="Village" value={member.origin} onChange={(e: InputChange) => updateData(i, {origin: e.target.value})} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersStep({ data, updateData, limit }: {
  data: PlayerFormState[];
  updateData: (index: number, val: Partial<PlayerFormState>) => void;
  limit: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black font-outfit">Liste des Joueurs</h2>
          <p className="text-muted text-sm">Exactement {limit} joueurs requis pour valider l’inscription</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-black uppercase">
          Joueurs: {limit} / Actuel: {data.filter((p) => p.name).length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((player, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-white/5 group hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <FormInput label="Nom Complet" className="flex-1" value={player.name} onChange={(e: InputChange) => updateData(i, {name: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormInput label="N°" placeholder="10" value={player.number} onChange={(e: InputChange) => updateData(i, {number: e.target.value})} />
              <FormInput label="Poste" placeholder="ATT" value={player.position} onChange={(e: InputChange) => updateData(i, {position: e.target.value})} />
              <FormInput label="Village" placeholder="Bassam" value={player.village} onChange={(e: InputChange) => updateData(i, {village: e.target.value})} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ACCEPTED_UPLOAD_TYPES: Record<string, string[]> = {
  document: ["application/pdf", "application/zip", "application/x-zip-compressed", "image/jpeg", "image/png", "image/webp"],
  image: ["image/jpeg", "image/png", "image/webp"],
};
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 Mo

function validateUploadFile(file: File, kind: "document" | "image"): string | null {
  if (!ACCEPTED_UPLOAD_TYPES[kind].includes(file.type)) {
    return kind === "image"
      ? "Format non supporté : utilisez une image JPG, PNG ou WebP."
      : "Format non supporté : utilisez un PDF, un ZIP ou une image.";
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return "Fichier trop lourd (max 10 Mo).";
  }
  return null;
}

function DocumentsStep({ data, updateData, teamName }: {
  data: DocumentsFormState;
  updateData: (val: Partial<DocumentsFormState>) => void;
  teamName: string;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (e: InputChange, key: "idCards" | "certificate") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUploadFile(file, "document");
    if (validationError) {
      window.alert(validationError);
      e.target.value = "";
      return;
    }

    setUploading(key);
    const fileExt = file.name.split('.').pop();
    const fileName = `${teamName.replace(/\s+/g, '-').toLowerCase()}-${key}-${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('team-docs')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('team-docs').getPublicUrl(filePath);
      updateData({ [key]: publicUrlData.publicUrl });
    } else {
      console.error("[upload] Error:", uploadError.message);
      window.alert("Erreur lors de l'upload. Vérifiez le format du fichier et réessayez.");
    }
    setUploading(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black font-outfit">Documents Obligatoires</h2>
      <div className="grid grid-cols-1 gap-6">
        <FileUpload
          label="Pièces d'identité (Groupées en un seul PDF ou ZIP)"
          description="Scans de tous les joueurs et staff"
          value={data.idCards}
          isUploading={uploading === 'idCards'}
          accept=".pdf,.zip,image/jpeg,image/png,image/webp"
          onChange={(e: InputChange) => handleUpload(e, 'idCards')}
        />
        <FileUpload
          label="Certificat de l'autorité locale"
          description="Signé et tamponné par le chef de village/canton"
          value={data.certificate}
          isUploading={uploading === 'certificate'}
          accept=".pdf,.zip,image/jpeg,image/png,image/webp"
          onChange={(e: InputChange) => handleUpload(e, 'certificate')}
        />
      </div>
    </div>
  );
}

function PaymentStep({ data, updateData, receiptData }: {
  data: TeamFormState;
  updateData: (val: Partial<DocumentsFormState>) => void;
  receiptData: string | null;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: InputChange) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUploadFile(file, "image");
    if (validationError) {
      window.alert(validationError);
      e.target.value = "";
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${data.name?.replace(/\s+/g, '-').toLowerCase()}-receipt-${Date.now()}.${fileExt}`;
    const filePath = `payments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('team-docs')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('team-docs').getPublicUrl(filePath);
      updateData({ receipt: publicUrlData.publicUrl });
    } else {
      console.error("[upload] Error:", uploadError.message);
      window.alert("Erreur lors de l'upload du reçu. Vérifiez le format et réessayez.");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-8 text-center py-8">
      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
        <CreditCard className="w-10 h-10" />
      </div>
      <div>
        <h2 className="text-3xl font-black font-outfit">Frais d’Affiliation</h2>
        <p className="text-muted text-lg mt-2">Montant à régler : <span className="text-white font-bold">400,000 FCFA</span></p>
      </div>

      <div className="p-6 rounded-2xl bg-secondary border border-border max-w-sm mx-auto space-y-4 text-left">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-400 text-sm flex gap-3 mb-6">
          <Info className="w-5 h-5 shrink-0" />
          <p>Veuillez effectuer le paiement via Mobile Money au <b>+241 00000000</b>. Ensuite, téléversez la capture d’écran du SMS de confirmation ci-dessous.</p>
        </div>

        <FileUpload
          label="Preuve de paiement (Reçu Airtel/Moov)"
          description="Capture d'écran de la transaction réussie"
          value={receiptData}
          isUploading={uploading}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
        />
      </div>
    </div>
  );
}

function FormInput({ label, placeholder, className, value, onChange }: {
  label: string;
  placeholder?: string;
  className?: string;
  value: string;
  onChange: (e: InputChange) => void;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</label>
      <input 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
      />
    </div>
  );
}

function FileUpload({ label, description, value, isUploading, accept, onChange }: {
  label: string;
  description: string;
  value: string | null;
  isUploading: boolean;
  accept?: string;
  onChange: (e: InputChange) => void;
}) {
  return (
    <div className="relative p-6 rounded-2xl border-2 border-dashed border-border bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer text-center group overflow-hidden">
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        accept={accept}
        onChange={onChange}
        disabled={isUploading}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-bold text-primary">Téléversement en cours...</span>
        </div>
      ) : value ? (
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div>
            <span className="text-sm font-bold text-green-500 block">Fichier enregistré avec succès</span>
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline relative z-20">Voir le document</a>
          </div>
        </div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-muted mx-auto mb-3 group-hover:text-primary transition-colors" />
          <div className="font-bold">{label}</div>
          <div className="text-xs text-muted mt-1">{description}</div>
          <div className="mt-4 px-4 py-2 rounded-lg bg-secondary text-xs font-bold inline-block border border-border group-hover:border-primary/50 relative z-0">
            Choisir un fichier
          </div>
        </>
      )}
    </div>
  );
}
