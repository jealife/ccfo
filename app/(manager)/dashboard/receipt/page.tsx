import Link from "next/link";
import { Clock, FileText, PlusCircle, XCircle } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PaymentReceipt } from "@/components/dashboard/PaymentReceipt";
import { REGISTRATION_FEE } from "@/lib/constants";

export const metadata = {
  title: "Mon Reçu — CCFO26",
  description: "Reçu officiel des frais d'affiliation de votre équipe",
};

export default async function ManagerReceiptPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [teamRes, profileRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, village, status, president_name, payment_receipt_url')
      .eq('manager_id', user?.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id)
      .maybeSingle(),
  ]);

  const team = teamRes.data;

  // `payments` n'est pas lisible sous RLS par un manager. L'équipe ci-dessus a
  // déjà été résolue via `manager_id = user.id` : on lit donc le paiement de
  // CETTE équipe uniquement, avec le client service role.
  const { data: payment } = team
    ? await createAdminClient()
        .from('payments')
        .select('id, amount, status, created_at, receipt_url')
        .eq('team_id', team.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">
          Mon Reçu
        </h1>
        <p className="text-muted text-sm mt-1">
          Reçu officiel des frais d&apos;affiliation ({REGISTRATION_FEE.toLocaleString("fr-FR")} FCFA).
        </p>
      </div>

      {!team ? (
        <EmptyState
          icon={<PlusCircle className="w-12 h-12 text-primary/30" />}
          title="Aucune équipe inscrite"
          message="Démarrez votre inscription pour obtenir un reçu une fois votre équipe validée."
          action={{ href: "/manager/registration", label: "Démarrer l'inscription" }}
        />
      ) : team.status === 'validated' && payment ? (
        <PaymentReceipt
          data={{
            paymentId: payment.id,
            createdAt: payment.created_at,
            amount: payment.amount,
            status: payment.status,
            proofUrl: payment.receipt_url ?? team.payment_receipt_url ?? null,
            teamName: team.name,
            teamVillage: team.village,
            presidentName: team.president_name,
            managerName: profileRes.data?.full_name || "Manager",
          }}
        />
      ) : team.status === 'rejected' ? (
        <EmptyState
          icon={<XCircle className="w-12 h-12 text-red-500/40" />}
          title="Dossier rejeté"
          message="Aucun reçu ne peut être émis tant que votre dossier n'a pas été corrigé et validé par l'administration."
          action={{ href: "/manager/registration", label: "Corriger mon dossier" }}
        />
      ) : (
        <EmptyState
          icon={<Clock className="w-12 h-12 text-yellow-500/40" />}
          title="Reçu pas encore disponible"
          message="Votre reçu officiel sera généré automatiquement dès que l'administration aura validé votre équipe et confirmé le paiement des frais d'affiliation."
          action={{ href: "/dashboard", label: "Retour au dashboard" }}
        />
      )}

      {team && team.status !== 'validated' && team.payment_receipt_url && (
        <div className="sports-card bg-card/40 border-white/5 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="font-bold text-sm">Votre preuve de paiement</div>
              <div className="text-[11px] text-muted">Transmise à l&apos;administration, en cours de vérification.</div>
            </div>
          </div>
          <a
            href={team.payment_receipt_url}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Consulter
          </a>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, message, action }: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="sports-card bg-card/40 border-white/5 p-10 text-center space-y-4">
      <div className="flex justify-center">{icon}</div>
      <h2 className="text-xl font-black font-outfit uppercase tracking-tight">{title}</h2>
      <p className="text-muted text-sm max-w-md mx-auto">{message}</p>
      <div className="pt-2">
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform"
        >
          {action.label}
        </Link>
      </div>
    </div>
  );
}
