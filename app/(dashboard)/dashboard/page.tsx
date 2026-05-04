import { createClient } from "@/lib/supabase/server";
import { 
  Users, 
  Trophy, 
  PlusCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  let teamCount = 0, paidCount = 0, playedCount = 0, teams: any[] = [];
  let managerTeam: any = null, nextMatch: any = null;

  if (isAdmin) {
    const { count: tCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
    const { count: pCount } = await supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'validated');
    const { count: mCount } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished');
    const { data: tData } = await supabase.from('teams').select('name, village, status, president_name').order('created_at', { ascending: false }).limit(8);
    teamCount = tCount || 0;
    paidCount = pCount || 0;
    playedCount = mCount || 0;
    teams = tData || [];
  } else {
    const { data: tData } = await supabase
      .from('teams')
      .select('*, players(count), staff(count)')
      .eq('manager_id', user?.id)
      .single();
    const { data: mData } = await supabase
      .from('matches')
      .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .limit(1)
      .single();
    managerTeam = tData;
    nextMatch = mData;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {isAdmin ? (
        <AdminUI stats={{ teamCount, paidCount, playedCount }} teams={teams} />
      ) : (
        <ManagerUI team={managerTeam} nextMatch={nextMatch} />
      )}
    </div>
  );
}

function AdminUI({ stats, teams }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">Dashboard Admin</h1>
        <p className="text-muted text-sm mt-1">Gestion centrale de la Coupe Cantonale Fieng Okano.</p>
      </div>

      {/* Stat cards — 3 colonnes compactes sur mobile */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <StatCard label="Équipes" value={stats.teamCount} icon={<Users />} trend="Inscrites" />
        <StatCard label="Validées" value={stats.paidCount} icon={<PlusCircle className="text-green-500" />} trend="Paiements" />
        <StatCard label="Matchs" value={stats.playedCount} icon={<Trophy className="text-accent" />} trend="Joués" />
      </div>

      {/* Tableau desktop (sm+) */}
      <div className="sports-card bg-card/40 border-white/5 overflow-hidden hidden sm:block">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-xs">Équipes & Statut Dossiers</h3>
          <Link href="/admin/teams" className="text-[10px] font-black uppercase text-primary hover:underline">Voir tout</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">Équipe</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted hidden md:table-cell">Village</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teams.map((team: any, i: number) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs shrink-0">{team.name[0]}</div>
                      <span className="font-bold text-sm truncate">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{team.village}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      team.status === 'validated' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {team.status === 'validated' ? 'Validé' : 'Attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards mobile */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-xs">Équipes récentes</h3>
          <Link href="/admin/teams" className="text-[10px] font-black uppercase text-primary">Voir tout</Link>
        </div>
        {teams.map((team: any, i: number) => (
          <div key={i} className="sports-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs shrink-0">{team.name[0]}</div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{team.name}</div>
                <div className="text-[10px] text-muted">{team.village}</div>
              </div>
            </div>
            <span className={cn(
              "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ml-2",
              team.status === 'validated' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
            )}>
              {team.status === 'validated' ? 'Validé' : 'Attente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManagerUI({ team, nextMatch }: any) {
  const playersCount = team?.players?.[0]?.count || 0;
  const staffCount = team?.staff?.[0]?.count || 0;
  const playersProgress = Math.min(100, (playersCount / 24) * 100);
  const staffProgress = Math.min(100, (staffCount / 6) * 100);
  
  const statusConfig: any = {
    incomplete: { label: "Incomplet", color: "bg-blue-500", text: "text-blue-500", desc: "Votre dossier nécessite votre attention." },
    pending:    { label: "En Attente", color: "bg-yellow-500", text: "text-yellow-500", desc: "L'administration vérifie vos informations." },
    validated:  { label: "Validé", color: "bg-green-500", text: "text-green-500", desc: "Votre équipe est officiellement inscrite !" },
    rejected:   { label: "Rejeté", color: "bg-red-500", text: "text-red-500", desc: "Corrigez les éléments signalés." },
    locked:     { label: "Verrouillé", color: "bg-gray-500", text: "text-gray-500", desc: "Deadline dépassée. Contactez l'administration." }
  };

  const currentStatus = team?.status ? statusConfig[team.status] : statusConfig.incomplete;

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">Mon Dashboard</h1>
        <p className="text-muted text-sm mt-1">Suivi de votre équipe et de la compétition.</p>
      </div>

      {/* Badge statut — pleine largeur sur mobile */}
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
                      <span className={playersCount >= 24 ? "text-green-500 font-black" : "text-primary font-black"}>{playersCount} / 24</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", playersCount >= 24 ? "bg-green-500" : "bg-primary")} style={{ width: `${playersProgress}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">Staff Technique</span>
                      <span className={staffCount >= 6 ? "text-green-500 font-black" : "text-accent font-black"}>{staffCount} / 6</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", staffCount >= 6 ? "bg-green-500" : "bg-accent")} style={{ width: `${staffProgress}%` }} />
                    </div>
                  </div>
                </div>

                {/* Boutons full-width sur mobile */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                  {(team.status === 'incomplete' || team.status === 'rejected') && (
                    <Link href="/manager/registration" className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center justify-center gap-2">
                      <PlusCircle className="w-4 h-4" /> Compléter le dossier
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
                <p className="text-muted text-sm">Vous n'avez pas encore commencé l'inscription.</p>
                <Link href="/manager/registration" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                  <PlusCircle className="w-4 h-4" /> Démarrer l'Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Prochain match */}
          <div className="sports-card bg-card/40 border-white/5 p-5 md:p-6">
            <h3 className="font-black uppercase tracking-widest text-xs mb-5">Prochain Match</h3>
            {nextMatch && nextMatch.home && nextMatch.away ? (
              <div className="flex items-center justify-around gap-4">
                <div className="flex-1 text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-black text-lg mx-auto">{nextMatch.home.name[0]}</div>
                  <div className="font-bold text-sm">{nextMatch.home.name}</div>
                </div>
                <div className="text-2xl font-black font-outfit italic text-white/20">VS</div>
                <div className="flex-1 text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-black text-lg mx-auto">{nextMatch.away.name[0]}</div>
                  <div className="font-bold text-sm">{nextMatch.away.name}</div>
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-muted italic text-sm">Aucun match programmé.</p>
            )}
          </div>
        </div>

        {/* Rappels */}
        <div className="sports-card bg-white/5 border-white/5 p-5 md:p-6 space-y-4 h-fit">
          <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent" /> Rappels
          </h3>
          <ul className="space-y-3">
            <li className="text-xs text-muted flex gap-2 items-start">
              <div className="w-1 h-1 bg-accent rounded-full mt-1.5 shrink-0" />
              Paiement affiliation requis.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: any) {
  return (
    <div className="glass-card p-4 md:p-8 group hover:border-primary/30 transition-all duration-500">
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-accent opacity-20" />
      </div>
      <div className="text-2xl md:text-4xl font-black font-outfit tracking-tighter mb-0.5">{value}</div>
      <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted leading-tight">{label}</div>
      <div className="mt-3 md:mt-6 pt-3 md:pt-6 border-t border-white/5 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[8px] md:text-[9px] font-black text-green-500 uppercase tracking-widest">{trend}</span>
      </div>
    </div>
  );
}
