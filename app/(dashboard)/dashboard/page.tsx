import { createClient } from "@/lib/supabase/server";
import { 
  Users, 
  Trophy, 
  PlusCircle,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch profile to get role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  // Fetch Data Server-side
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
    <div className="space-y-8 animate-fade-in">
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Dashboard Admin</h1>
        <p className="text-muted text-sm">Gestion centrale de la Coupe Cantonale Fieng Okano.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Équipes Inscrites" value={stats.teamCount} icon={<Users />} trend="Total des inscriptions" />
        <StatCard label="Paiements Validés" value={stats.paidCount} icon={<PlusCircle className="text-green-500" />} trend="Affiliations confirmées" />
        <StatCard label="Matchs Joués" value={stats.playedCount} icon={<Trophy className="text-accent" />} trend="Progression tournoi" />
      </div>

      <div className="sports-card bg-card/40 border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-black uppercase tracking-widest text-xs">Équipes & Statut Dossiers</h3>
          <Link href="/admin/teams" className="text-[10px] font-black uppercase text-primary hover:underline">Voir tout</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Équipe</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Village</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teams.map((team: any, i: number) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">{team.name[0]}</div>
                      <span className="font-bold text-sm">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{team.village}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      team.status === 'validated' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {team.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ManagerUI({ team, nextMatch }: any) {
  // Calcul de la progression
  const playersCount = team?.players?.[0]?.count || 0;
  const staffCount = team?.staff?.[0]?.count || 0;
  const playersProgress = Math.min(100, (playersCount / 24) * 100);
  const staffProgress = Math.min(100, (staffCount / 6) * 100);
  
  // Statuts configuration
  const statusConfig: any = {
    incomplete: { label: "Incomplet", color: "bg-blue-500", text: "text-blue-500", desc: "Votre dossier nécessite votre attention. Complétez-le avant la deadline." },
    pending: { label: "En Attente de Validation", color: "bg-yellow-500", text: "text-yellow-500", desc: "Dossier soumis. L'administration vérifie vos informations." },
    validated: { label: "Validé (Officiel)", color: "bg-green-500", text: "text-green-500", desc: "Félicitations, votre équipe est officiellement inscrite au tournoi !" },
    rejected: { label: "Rejeté (Corrections requises)", color: "bg-red-500", text: "text-red-500", desc: "Votre dossier a été rejeté. Veuillez corriger les éléments bloquants." },
    locked: { label: "Verrouillé", color: "bg-gray-500", text: "text-gray-500", desc: "Deadline dépassée. Contactez l'administration." }
  };

  const currentStatus = team?.status ? statusConfig[team.status] : statusConfig.incomplete;

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Mon Dashboard</h1>
        <p className="text-muted text-sm">Suivi de votre équipe et de la compétition.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE: Suivi du Dossier */}
        <div className="lg:col-span-2 space-y-6">
          <div className="sports-card bg-card/40 backdrop-blur-md border-white/5 p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-black font-outfit uppercase">Suivi du Dossier</h2>
                <p className="text-sm text-muted mt-1">{currentStatus.desc}</p>
              </div>
              <div className={cn("px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] border border-white/10", currentStatus.color + "/10", currentStatus.text)}>
                {currentStatus.label}
              </div>
            </div>

            {team ? (
              <div className="space-y-6">
                {/* Jauges de progression */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                  {(team.status === 'incomplete' || team.status === 'rejected') && (
                    <Link href="/manager/registration" className="px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" /> Compléter le dossier
                    </Link>
                  )}
                  <Link href="/dashboard/my-team" className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-bold text-xs transition-all flex items-center gap-2">
                    <Users className="w-4 h-4" /> Voir mon équipe
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <Trophy className="w-16 h-16 mx-auto text-primary/30" />
                <p className="text-muted">Vous n'avez pas encore commencé l'inscription de votre équipe.</p>
                <Link href="/manager/registration" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                  <PlusCircle className="w-4 h-4" /> Démarrer l'Inscription
                </Link>
              </div>
            )}
          </div>

          <div className="sports-card bg-card/40 border-white/5 p-6">
            <h3 className="font-black uppercase tracking-widest text-xs mb-6">Prochain Match</h3>
            {nextMatch && nextMatch.home && nextMatch.away ? (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="text-center font-bold text-sm text-balance">{nextMatch.home.name}</div>
                <div className="text-2xl font-black font-outfit italic text-white/20 px-4">VS</div>
                <div className="text-center font-bold text-sm text-balance">{nextMatch.away.name}</div>
              </div>
            ) : (
              <p className="text-center py-4 text-muted italic text-sm">Aucun match programmé.</p>
            )}
          </div>
        </div>

        <div className="sports-card bg-white/5 border-white/5 p-6 space-y-4">
          <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent" /> Rappels
          </h3>
          <ul className="space-y-3">
            <li className="text-xs text-muted flex gap-2">
              <div className="w-1 h-1 bg-accent rounded-full mt-1.5" /> Paiement affiliation requis.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: any) {
  return (
    <div className="glass-card p-8 group hover:border-primary/30 transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">{icon}</div>
        <TrendingUp className="w-4 h-4 text-accent opacity-20" />
      </div>
      <div className="text-4xl font-black font-outfit tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{trend}</span>
      </div>
    </div>
  );
}
