import { createClient } from "@/lib/supabase/server";
import {
  Users,
  Trophy,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata = {
  title: "Mon Dashboard — CCFO26",
  description: "Tableau de bord manager de la Coupe Cantonale Fieng Okano 2026",
};

export default async function ManagerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: team } = await supabase
    .from('teams')
    .select('*, players(count), staff(count)')
    .eq('manager_id', user?.id)
    .single();

  const { data: config } = await supabase
    .from('tournament_config')
    .select('*')
    .single();

  let nextMatch = null;
  if (team) {
    const { data } = await supabase
      .from('matches')
      .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .in('status', ['scheduled', 'live'])
      .order('match_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    nextMatch = data;
  }

  const playersLimit = config?.players_per_team || 24;
  const staffLimit = config?.staff_per_team || 6;

  const playersCount = team?.players?.[0]?.count || 0;
  const staffCount = team?.staff?.[0]?.count || 0;
  const playersProgress = Math.min(100, (playersCount / playersLimit) * 100);
  const staffProgress = Math.min(100, (staffCount / staffLimit) * 100);

  const statusConfig: Record<string, { label: string; color: string; text: string; desc: string }> = {
    incomplete: { label: "Incomplet", color: "bg-blue-500", text: "text-blue-500", desc: "Votre dossier nécessite votre attention." },
    pending:    { label: "En Attente", color: "bg-yellow-500", text: "text-yellow-500", desc: "L'administration vérifie vos informations." },
    validated:  { label: "Validé", color: "bg-green-500", text: "text-green-500", desc: "Votre équipe est officiellement inscrite !" },
    rejected:   { label: "Rejeté", color: "bg-red-500", text: "text-red-500", desc: "Corrigez les éléments signalés." },
    locked:     { label: "Verrouillé", color: "bg-gray-500", text: "text-gray-500", desc: "Deadline dépassée. Contactez l'administration." }
  };

  const currentStatus = team?.status ? statusConfig[team.status] : statusConfig.incomplete;

  const rappelItems: string[] = !team
    ? ["Démarrez votre inscription pour participer au tournoi."]
    : team.status === 'validated'
    ? [
        "Votre équipe est officiellement inscrite. Bonne chance !",
        ...(nextMatch ? ["Préparez-vous pour votre prochain match."] : []),
      ]
    : team.status === 'pending'
    ? ["Votre dossier est en cours de vérification par l'administration."]
    : team.status === 'rejected'
    ? ["Corrigez les éléments signalés dans votre dossier.", "Paiement de 400 000 FCFA requis."]
    : ["Complétez votre dossier avant la date limite.", "Paiement de 400 000 FCFA requis."];

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">Mon Dashboard</h1>
        <p className="text-muted text-sm mt-1">Suivi de votre équipe et de la compétition.</p>
      </div>

      {/* Status Badge */}
      <div className={cn(
        "w-full px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3",
        currentStatus.color + "/10", currentStatus.text
      )}>
        {currentStatus.label === "Validé"
          ? <CheckCircle2 className="w-5 h-5 shrink-0" />
          : <Clock className="w-5 h-5 shrink-0" />}
        <div className="min-w-0">
          <div className="font-black text-sm uppercase tracking-widest">{currentStatus.label}</div>
          <div className="text-[10px] font-medium opacity-80 mt-0.5">{currentStatus.desc}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Suivi du dossier */}
          <div className="sports-card bg-card/40 backdrop-blur-md border-white/5 p-5 md:p-6">
            <h2 className="text-base md:text-xl font-black font-outfit uppercase mb-5">Suivi du Dossier</h2>

            {team ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">Joueurs Inscrits</span>
                      <span className={playersCount >= playersLimit ? "text-green-500 font-black" : "text-primary font-black"}>
                        {playersCount} / {playersLimit}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", playersCount >= playersLimit ? "bg-green-500" : "bg-primary")}
                        style={{ width: `${playersProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">Staff Technique</span>
                      <span className={staffCount >= staffLimit ? "text-green-500 font-black" : "text-accent font-black"}>
                        {staffCount} / {staffLimit}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", staffCount >= staffLimit ? "bg-green-500" : "bg-accent")}
                        style={{ width: `${staffProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                  {(team.status === 'incomplete' || team.status === 'rejected') && (
                    <Link href="/manager/registration" className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center justify-center gap-2">
                      <PlusCircle className="w-4 h-4" /> Compléter le dossier
                    </Link>
                  )}
                  {team.status === 'validated' && (
                    <Link href="/dashboard/receipt" className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-black uppercase tracking-widest text-xs hover:bg-green-500/20 transition-all flex items-center justify-center gap-2">
                      <Receipt className="w-4 h-4" /> Voir mon reçu
                    </Link>
                  )}
                  <Link href="/dashboard/my-team" className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-bold text-xs transition-all flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" /> Voir mon équipe
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <Trophy className="w-14 h-14 mx-auto text-primary/30" />
                <p className="text-muted text-sm">Vous n&apos;avez pas encore commencé l&apos;inscription.</p>
                <Link href="/manager/registration" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                  <PlusCircle className="w-4 h-4" /> Démarrer l&apos;Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Prochain match */}
          <div className="sports-card bg-card/40 border-white/5 p-5 md:p-6">
            <h3 className="font-black uppercase tracking-widest text-xs mb-5">Prochain Match</h3>
            {nextMatch && nextMatch.home && nextMatch.away ? (
              <Link href={`/matches/${nextMatch.id}`} className="block group/match hover:bg-white/5 rounded-xl transition-all -m-3 p-3">
                <div className="flex items-center justify-around gap-4">
                  <div className="flex-1 text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-black text-lg mx-auto group-hover/match:scale-105 transition-transform">
                      {nextMatch.home.name[0]}
                    </div>
                    <div className="font-bold text-sm">{nextMatch.home.name}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-2xl font-black font-outfit italic text-white/20">VS</div>
                    <div className="text-[10px] font-bold text-primary text-center">
                      {new Date(nextMatch.match_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-[10px] font-black text-primary/60 text-center">
                      {new Date(nextMatch.match_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex-1 text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-black text-lg mx-auto group-hover/match:scale-105 transition-transform">
                      {nextMatch.away.name[0]}
                    </div>
                    <div className="font-bold text-sm">{nextMatch.away.name}</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted group-hover/match:text-primary transition-colors">
                  Voir le match <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ) : (
              <p className="text-center py-4 text-muted italic text-sm">
                {team ? "Aucun match programmé pour votre équipe." : "Aucun match programmé."}
              </p>
            )}
          </div>
        </div>

        {/* Rappels */}
        <div className="sports-card bg-white/5 border-white/5 p-5 md:p-6 space-y-4 h-fit">
          <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent" /> Rappels
          </h3>
          <ul className="space-y-3">
            {rappelItems.map((item, i) => (
              <li key={i} className="text-xs text-muted flex gap-2 items-start">
                <div className="w-1 h-1 bg-accent rounded-full mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
