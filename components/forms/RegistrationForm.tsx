"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
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
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitTeamRegistration, saveRegistrationDraft } from "@/app/api/registration/actions";
import { createClient } from "@/lib/supabase/client";
import { AlertDialog } from "@/components/ui/Modal";
import type { TournamentConfig } from "@/lib/types";
import Link from "next/link";
import { MOBILE_MONEY_NUMBER } from "@/lib/constants";
import { translateUploadError } from "@/lib/errors";

type TeamFormState = { name: string; village: string; color: string; president: string; phone: string; whatsapp: string; email: string };
type StaffFormState = { name: string; role: string; village: string; dob: string; photo: string | null; idDocument: string | null };
type PlayerFormState = { name: string; number: string; dob: string; position: string; village: string; idDocument: string | null };
type DocumentsFormState = { receipt: string | null };
type FormState = {
  team: TeamFormState;
  staff: StaffFormState[];
  players: PlayerFormState[];
  documents: DocumentsFormState;
};
type InputChange = React.ChangeEvent<HTMLInputElement>;

/** Chemin de photo staff (hors composant : Date.now() ne doit pas être appelé au rendu) */
function makeStaffPhotoPath(teamSlug: string, index: number, ext: string | undefined) {
  return `staff-photos/${teamSlug}-staff-${index + 1}-${Date.now()}.${ext}`;
}

function toFrDate(isoDate: string | null | undefined) {
  if (!isoDate) return "";
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function toIsoDate(frDate: string | null | undefined) {
  if (!frDate || frDate.length !== 10) return "";
  const parts = frDate.split('/');
  if (parts.length !== 3) return "";
  const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
  if (isNaN(new Date(iso).getTime())) return "";
  return iso;
}

const STEPS = [
  { id: 1, title: "Équipe", icon: <Users className="w-5 h-5" /> },
  { id: 2, title: "Staff", icon: <UserPlus className="w-5 h-5" /> },
  { id: 3, title: "Joueurs", icon: <Users className="w-4 h-4" /> },
  { id: 4, title: "Paiement", icon: <CreditCard className="w-5 h-5" /> },
];

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; title: string; message: string; type: "error" | "warning" | "info" }>({
    isOpen: false, title: "", message: "", type: "info"
  });

  const showAlert = (title: string, message: string, type: "error" | "warning" | "info" = "warning") =>
    setAlertDialog({ isOpen: true, title, message, type });
  
  const [formData, setFormData] = useState<FormState>({
    team: { name: "", village: "", color: "", president: "", phone: "", whatsapp: "", email: "" },
    staff: Array(6).fill({ name: "", role: "", village: "", dob: "", photo: null, idDocument: null }),
    players: Array(24).fill({ name: "", number: "", dob: "", position: "", village: "", idDocument: null }),
    documents: { receipt: null }
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Toujours pointer vers les dernières données, pour les handlers hors-cycle React (visibilitychange, pagehide).
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Un seul appel serveur à la fois : évite que deux sauvegardes en base se chevauchent
  // (delete + réinsertion du staff/joueurs n'est pas transactionnel) et corrompent les données.
  const savingRef = useRef(false);
  const pendingSaveRef = useRef<FormState | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const performSaveDraftRef = useRef<(data: FormState) => Promise<void>>(async () => {});

  const performSaveDraft = useCallback(async (data: FormState) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    savingRef.current = true;
    setSaveStatus("saving");
    try {
      const result = await saveRegistrationDraft(data);
      if (!result?.success) throw new Error(result?.error || "Échec de la sauvegarde");
      retryCountRef.current = 0;
      setSaveStatus("saved");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde automatique en base", err);
      setSaveStatus("error");
      // Nouvelle tentative (jusqu'à 3x) : un échec de sauvegarde ne doit jamais rester silencieux.
      if (retryCountRef.current < 3) {
        retryCountRef.current += 1;
        retryTimeoutRef.current = setTimeout(() => {
          if (!savingRef.current) performSaveDraftRef.current(data);
        }, 5000);
      }
    } finally {
      savingRef.current = false;
      // Une nouvelle version des données est arrivée pendant l'appel : on l'enchaîne
      // au lieu de la sauvegarder en parallèle.
      if (pendingSaveRef.current) {
        const next = pendingSaveRef.current;
        pendingSaveRef.current = null;
        performSaveDraftRef.current(next);
      }
    }
  }, []);

  useEffect(() => {
    performSaveDraftRef.current = performSaveDraft;
  }, [performSaveDraft]);

  const requestSaveDraft = useCallback((data: FormState) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryCountRef.current = 0;
    if (savingRef.current) {
      pendingSaveRef.current = data;
    } else {
      performSaveDraft(data);
    }
  }, [performSaveDraft]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // Sauvegarde automatique dans le localStorage ET en base de données
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("registrationFormDraft", JSON.stringify(formData));
      localStorage.setItem("registrationFormStep", currentStep.toString());
    }
  }, [formData, currentStep, isLoaded]);

  useEffect(() => {
    if (!isLoaded || isSubmitting || isSuccess) return;

    // Auto-save en base de données avec debounce de 3 secondes
    const handler = setTimeout(() => {
      requestSaveDraft(formData);
    }, 3000);

    return () => clearTimeout(handler);
  }, [formData, isLoaded, isSubmitting, isSuccess, requestSaveDraft]);

  // Filet de sécurité : si l'utilisateur change d'onglet, met l'app en arrière-plan
  // ou ferme la page avant la fin des 3s de debounce, on force une sauvegarde immédiate
  // pour ne pas perdre les dernières modifications.
  useEffect(() => {
    if (!isLoaded) return;
    const flush = () => {
      if (isSubmitting || isSuccess) return;
      requestSaveDraft(formDataRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [isLoaded, isSubmitting, isSuccess, requestSaveDraft]);

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
        const mappedStaff = Array(sLimit).fill({ name: "", role: "", village: "", dob: "", photo: null, idDocument: null });
        staffData?.forEach((s, i) => {
          if (i < sLimit) mappedStaff[i] = {
            name: `${s.first_name} ${s.last_name}`,
            role: s.role,
            village: s.origin_village || "",
            dob: toFrDate(s.date_of_birth),
            photo: s.photo_url || null,
            idDocument: s.identity_docs_url || null,
          };
        });

        // Map existing players into fixed-size array
        const mappedPlayers = Array(pLimit).fill({ name: "", number: "", dob: "", position: "", village: "", idDocument: null });
        playersData?.forEach((p, i) => {
          if (i < pLimit) mappedPlayers[i] = { name: p.full_name, number: String(p.jersey_number ?? ""), dob: toFrDate(p.date_of_birth), position: p.position || "", village: p.origin_village || "", idDocument: p.identity_docs_url || null };
        });

        setFormData({
          team: {
            name: teamData.name === "Brouillon" ? "" : (teamData.name || ""),
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
            receipt: teamData.payment_receipt_url || null
          }
        });

        // If team is already submitted or validated, show success
        if (teamData.status === 'validated' || teamData.status === 'pending') {
          setIsSuccess(true);
        } else {
          // Compute highest step to resume from
          let nextStep = 1;
          const isTeamComplete = teamData.name && teamData.name !== "Brouillon" && teamData.village && teamData.president_name && teamData.president_phone;
          const validStaffCount = staffData?.length || 0;
          const isStaffComplete = validStaffCount >= sLimit;
          const validPlayersCount = playersData?.length || 0;
          const isPlayersComplete = validPlayersCount >= pLimit;

          if (isTeamComplete) {
            nextStep = 2;
            if (isStaffComplete) {
              nextStep = 3;
              if (isPlayersComplete) {
                nextStep = 4;
              }
            }
          }

          if (teamData.name !== "Brouillon" || validStaffCount > 0 || validPlayersCount > 0) {
            showAlert("Brouillon trouvé", "Nous avons restauré votre inscription en cours.", "info");
            setCurrentStep(nextStep);
          }
        }
      } else {
        // Aucune équipe en base, on tente de récupérer le brouillon local
        const draft = typeof window !== "undefined" ? localStorage.getItem("registrationFormDraft") : null;
        if (draft) {
          try {
            const parsedDraft = JSON.parse(draft);
            
            // On s'assure de respecter les limites actuelles du tournoi
            const mappedStaff = Array(sLimit).fill({ name: "", role: "", village: "", dob: "", photo: null, idDocument: null });
            if (parsedDraft.staff && Array.isArray(parsedDraft.staff)) {
              parsedDraft.staff.forEach((s: any, i: number) => {
                if (i < sLimit) mappedStaff[i] = { ...mappedStaff[i], ...s };
              });
            }
            
            const mappedPlayers = Array(pLimit).fill({ name: "", number: "", dob: "", position: "", village: "", idDocument: null });
            if (parsedDraft.players && Array.isArray(parsedDraft.players)) {
              parsedDraft.players.forEach((p: any, i: number) => {
                if (i < pLimit) mappedPlayers[i] = { ...mappedPlayers[i], ...p };
              });
            }

            setFormData({
              team: { name: "", village: "", color: "", president: "", phone: "", whatsapp: "", email: "", ...(parsedDraft.team || {}) },
              staff: mappedStaff,
              players: mappedPlayers,
              documents: { receipt: null, ...(parsedDraft.documents || {}) }
            });

            const savedStep = localStorage.getItem("registrationFormStep");
            if (savedStep) {
              const step = parseInt(savedStep, 10);
              if (!isNaN(step) && step >= 1 && step <= STEPS.length) {
                setCurrentStep(step);
              }
            }

            setIsLoaded(true);
            return;
          } catch(e) {
            console.error("Failed to parse form draft from localStorage", e);
          }
        }

        // Default empty arrays if no team exists yet and no valid draft
        setFormData(prev => ({
          ...prev,
          staff: Array(sLimit).fill({ name: "", role: "", village: "", dob: "", photo: null, idDocument: null }),
          players: Array(pLimit).fill({ name: "", number: "", dob: "", position: "", village: "", idDocument: null }),
        }));
      }
      setIsLoaded(true);
    }
    loadData();
  }, []);

  const playersLimit = config?.players_per_team || 24;
  const staffLimit = config?.staff_per_team || 6;

  /**
   * Contrôles du dossier complet. On ne bloque plus la navigation entre les
   * étapes : le manager circule librement et remplit dans l'ordre qu'il veut.
   * Ces règles ne s'appliquent qu'à la soumission finale.
   */
  const collectSubmissionIssues = (): string[] => {
    const issues: string[] = [];
    const { name, village, president, phone } = formData.team;
    if (!name || !village || !president || !phone) {
      issues.push("Étape Équipe : nom, village, président et téléphone sont obligatoires.");
    }

    const validStaff = formData.staff.filter(s => s.name.trim() !== "");
    if (validStaff.length < staffLimit) {
      issues.push(`Étape Staff : ${staffLimit} membres requis, ${validStaff.length} renseigné(s).`);
    }

    const validPlayers = formData.players.filter(p => p.name.trim() !== "");
    if (validPlayers.length < playersLimit) {
      issues.push(`Étape Joueurs : ${playersLimit} joueurs requis, ${validPlayers.length} renseigné(s).`);
    }

    const missingDob = validPlayers.filter(p => p.dob.length !== 10 || !toIsoDate(p.dob));
    if (missingDob.length > 0) {
      issues.push(
        `Étape Joueurs : date de naissance manquante ou invalide pour ${missingDob.length} joueur(s) — ${missingDob.slice(0, 3).map(p => p.name.trim()).join(", ")}${missingDob.length > 3 ? "…" : ""}.`
      );
    }

    return issues;
  };

  const nextStep = async () => {
    if (currentStep === STEPS.length) {
      const issues = collectSubmissionIssues();
      if (issues.length > 0) {
        showAlert("Dossier incomplet", issues.join("\n\n"));
        return;
      }
      await handleSubmit();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleSubmit = async () => {
    // La soumission finale remplace le brouillon : on annule toute sauvegarde
    // auto en attente pour éviter qu'elle n'écrase le résultat juste après.
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    pendingSaveRef.current = null;
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
          .map((s) => ({
            full_name: s.name.trim(),
            role: s.role,
            origin_village: s.village,
            date_of_birth: toIsoDate(s.dob),
            photo_url: s.photo,
            identity_docs_url: s.idDocument,
          })),
        players: formData.players
          .filter((p) => p.name.trim())
          .map((p) => ({
            full_name: p.name.trim(),
            jersey_number: p.number,
            position: p.position,
            date_of_birth: toIsoDate(p.dob),
            origin_village: p.village,
            identity_docs_url: p.idDocument,
          })),
        documents: {
          payment_receipt: formData.documents.receipt,
        },
      });
      if (result.success) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("registrationFormDraft");
          localStorage.removeItem("registrationFormStep");
        }
        setIsSuccess(true);
      } else {
        showAlert("Erreur", result.error || "Erreur lors de l'inscription. Veuillez réessayer.", "error");
      }
    } catch {
      showAlert("Erreur", "Une erreur inattendue est survenue. Contactez l'administration si le problème persiste.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // N'évalue les règles de complétude que sur la dernière étape : c'est là
  // que "Soumettre" doit rester désactivé tant que le dossier n'est pas prêt.
  const submissionIssues = currentStep === STEPS.length ? collectSubmissionIssues() : [];

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
      <div className="mb-8 md:mb-12 flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
        {/* Navigation libre : cliquer sur une étape y va directement. */}
        {STEPS.map((step) => (
          <button
            type="button"
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            title={`Aller à l’étape ${step.title}`}
            className="relative z-10 flex flex-col items-center gap-1 md:gap-2 group cursor-pointer"
          >
            <div
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 group-hover:scale-110",
                currentStep === step.id
                  ? "bg-primary border-primary text-white"
                  : currentStep > step.id
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-background border-border text-muted group-hover:border-primary/40"
              )}
            >
              {currentStep > step.id ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <div className="scale-75 md:scale-100">{step.icon}</div>}
            </div>
            <span className={cn(
              "text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-colors mt-1 text-center leading-tight max-w-[60px] md:max-w-none",
              currentStep >= step.id ? "text-primary" : "text-muted group-hover:text-foreground"
            )}>
              {step.title}
            </span>
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="sports-card p-3 sm:p-8 bg-card/40 backdrop-blur-xl border-white/5 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {currentStep === 1 && <TeamStep data={formData.team} updateData={(val) => setFormData({...formData, team: {...formData.team, ...val}})} />}
            {currentStep === 2 && <StaffStep data={formData.staff} limit={staffLimit} teamName={formData.team.name} showAlert={showAlert} updateData={(index, val) => {
              const newStaff = [...formData.staff];
              newStaff[index] = {...newStaff[index], ...val};
              setFormData({...formData, staff: newStaff});
            }} />}
            {currentStep === 3 && <PlayersStep data={formData.players} limit={playersLimit} showAlert={showAlert} updateData={(index, val) => {
              const newPlayers = [...formData.players];
              newPlayers[index] = {...newPlayers[index], ...val};
              setFormData({...formData, players: newPlayers});
            }} />}
            {currentStep === 4 && <PaymentStep data={formData.team} showAlert={showAlert} updateData={(val) => setFormData({...formData, documents: {...formData.documents, ...val}})} receiptData={formData.documents.receipt} />}
          </motion.div>
        </AnimatePresence>

        <SaveStatusIndicator status={saveStatus} />

        {currentStep === STEPS.length && submissionIssues.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs space-y-1.5">
            <p className="font-black uppercase tracking-widest">Dossier incomplet — à corriger avant de soumettre</p>
            <ul className="list-disc list-inside space-y-0.5">
              {submissionIssues.map((issue, i) => <li key={i}>{issue}</li>)}
            </ul>
          </div>
        )}

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
            disabled={isSubmitting || (currentStep === STEPS.length && submissionIssues.length > 0)}
            title={submissionIssues.length > 0 ? submissionIssues.join("\n") : undefined}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100"
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

function SaveStatusIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;

  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-widest">
      {status === "saving" && (
        <span className="flex items-center gap-1.5 text-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Sauvegarde en cours…
        </span>
      )}
      {status === "saved" && (
        <span className="flex items-center gap-1.5 text-primary">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Brouillon enregistré
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          Échec de la sauvegarde — nouvelle tentative… Si le problème persiste, contactez l'administration.
        </span>
      )}
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

function StaffStep({ data, updateData, limit, teamName, showAlert }: {
  data: StaffFormState[];
  updateData: (index: number, val: Partial<StaffFormState>) => void;
  limit: number;
  teamName: string;
  showAlert: (title: string, message: string, type?: "error" | "warning" | "info") => void;
}) {
  const supabase = createClient();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handlePhotoUpload = async (e: InputChange, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUploadFile(file, "image");
    if (validationError) {
      showAlert("Photo non acceptée", validationError, "error");
      e.target.value = "";
      return;
    }

    setUploadingIndex(index);
    const slug = (teamName || "equipe").replace(/\s+/g, '-').toLowerCase();
    const filePath = makeStaffPhotoPath(slug, index, file.name.split('.').pop());

    const { error: uploadError } = await supabase.storage.from('team-docs').upload(filePath, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('team-docs').getPublicUrl(filePath);
      updateData(index, { photo: publicUrlData.publicUrl });
    } else {
      console.error("[upload] Error:", uploadError.message);
      showAlert("Erreur d'envoi", translateUploadError(uploadError.message), "error");
    }
    setUploadingIndex(null);
  };

  const [uploadingIdIndex, setUploadingIdIndex] = useState<number | null>(null);

  const handleIdUpload = async (e: InputChange, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUploadFile(file, "document");
    if (validationError) {
      showAlert("Document non accepté", validationError, "error");
      e.target.value = "";
      return;
    }

    setUploadingIdIndex(index);
    const filePath = `staff-docs/membre-${index + 1}-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage.from('team-docs').upload(filePath, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('team-docs').getPublicUrl(filePath);
      updateData(index, { idDocument: publicUrlData.publicUrl });
    } else {
      console.error("[upload] Error:", uploadError.message);
      showAlert("Erreur d'envoi", translateUploadError(uploadError.message), "error");
    }
    setUploadingIdIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-2xl font-black font-outfit">Staff Technique</h2>
          <p className="text-muted text-xs md:text-sm">Exactement {limit} membres requis — chaque membre fournit sa propre pièce d’identité</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-black uppercase self-start md:self-auto">
          Requis: {limit} / Actuel: {data.filter((s) => s.name).length}
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((member, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-white/5 flex flex-col md:flex-row gap-4 items-start">
            {/* Photo de licence */}
            <label className="relative w-full md:w-20 h-32 md:h-24 shrink-0 rounded-xl overflow-hidden border-2 border-dashed border-border bg-secondary/50 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-center group">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handlePhotoUpload(e, i)}
                disabled={uploadingIndex === i}
              />
              {uploadingIndex === i ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : member.photo ? (
                <Image src={member.photo} alt={member.name || `Membre ${i + 1}`} fill className="object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted group-hover:text-primary transition-colors">
                  <Camera className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Photo</span>
                </div>
              )}
            </label>

            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label={`Nom Membre ${i + 1}`} placeholder="Nom complet" value={member.name} onChange={(e: InputChange) => updateData(i, {name: e.target.value})} />
                <FormInput label="Rôle" placeholder="Coach, Assistant, etc." value={member.role} onChange={(e: InputChange) => updateData(i, {role: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="Village" placeholder="ex: Fieng Okano" value={member.village} onChange={(e: InputChange) => updateData(i, {village: e.target.value})} />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormDateInput label="Date de naissance" value={member.dob} onChange={(val) => updateData(i, {dob: val})} />
                  </div>
                  <label className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-[9px] font-black uppercase tracking-widest",
                    member.idDocument
                      ? "border-green-500/40 bg-green-500/10 text-green-500"
                      : "border-border bg-secondary/50 text-muted hover:border-primary/50 hover:text-primary"
                  )}>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.zip,image/jpeg,image/png,image/webp"
                      onChange={(e) => handleIdUpload(e, i)}
                      disabled={uploadingIdIndex === i}
                    />
                    {uploadingIdIndex === i ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : member.idDocument ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    Pièce ID
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersStep({ data, updateData, limit, showAlert }: {
  data: PlayerFormState[];
  updateData: (index: number, val: Partial<PlayerFormState>) => void;
  limit: number;
  showAlert: (title: string, message: string, type?: "error" | "warning" | "info") => void;
}) {
  const supabase = createClient();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleIdUpload = async (e: InputChange, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUploadFile(file, "document");
    if (validationError) {
      showAlert("Document non accepté", validationError, "error");
      e.target.value = "";
      return;
    }

    setUploadingIndex(index);
    const filePath = `player-docs/joueur-${index + 1}-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage.from('team-docs').upload(filePath, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('team-docs').getPublicUrl(filePath);
      updateData(index, { idDocument: publicUrlData.publicUrl });
    } else {
      console.error("[upload] Error:", uploadError.message);
      showAlert("Erreur d'envoi", translateUploadError(uploadError.message), "error");
    }
    setUploadingIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-2xl font-black font-outfit">Liste des Joueurs</h2>
          <p className="text-muted text-xs md:text-sm">Exactement {limit} joueurs requis — chaque joueur doit fournir sa propre pièce d’identité</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-black uppercase self-start md:self-auto">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FormInput label="N°" placeholder="10" value={player.number} onChange={(e: InputChange) => updateData(i, {number: e.target.value})} />
              <FormInput label="Poste" placeholder="ATT" value={player.position} onChange={(e: InputChange) => updateData(i, {position: e.target.value})} />
              <div className="col-span-2 md:col-span-1">
                <FormInput label="Village" placeholder="Bassam" value={player.village} onChange={(e: InputChange) => updateData(i, {village: e.target.value})} />
              </div>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1">
                <FormDateInput
                  label="Date de naissance *"
                  value={player.dob}
                  onChange={(val) => updateData(i, {dob: val})}
                />
              </div>
              <label className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-[9px] font-black uppercase tracking-widest",
                player.idDocument
                  ? "border-green-500/40 bg-green-500/10 text-green-500"
                  : "border-border bg-secondary/50 text-muted hover:border-primary/50 hover:text-primary"
              )}>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.zip,image/jpeg,image/png,image/webp"
                  onChange={(e) => handleIdUpload(e, i)}
                  disabled={uploadingIndex === i}
                />
                {uploadingIndex === i ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : player.idDocument ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                Pièce ID
              </label>
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

function PaymentStep({ data, updateData, receiptData, showAlert }: {
  data: TeamFormState;
  updateData: (val: Partial<DocumentsFormState>) => void;
  receiptData: string | null;
  showAlert: (title: string, message: string, type?: "error" | "warning" | "info") => void;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: InputChange) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateUploadFile(file, "image");
    if (validationError) {
      showAlert("Reçu non accepté", validationError, "error");
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
      showAlert("Erreur d'envoi", translateUploadError(uploadError.message), "error");
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
          <p>Veuillez effectuer le paiement via Mobile Money au <b>{MOBILE_MONEY_NUMBER}</b>. Ensuite, téléversez la capture d’écran du SMS de confirmation ci-dessous.</p>
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

function FormInput({ label, placeholder, className, value, onChange, type }: {
  label: string;
  placeholder?: string;
  className?: string;
  value: string;
  onChange: (e: InputChange) => void;
  type?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
      />
    </div>
  );
}

function FormDateInput({ label, value, onChange, className }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d/]/g, ""); 
    
    // Si l'utilisateur supprime un slash, on supprime aussi le chiffre précédent
    if (value.endsWith("/") && e.target.value.length < value.length) {
       val = e.target.value.slice(0, -1);
    }

    const digits = val.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length > 2) formatted += "/" + digits.substring(2, 4);
    if (digits.length > 4) formatted += "/" + digits.substring(4, 8);
    
    onChange(formatted);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="JJ/MM/AAAA"
        value={value}
        onChange={handleChange}
        maxLength={10}
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
