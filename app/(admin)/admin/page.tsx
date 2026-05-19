import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  Users,
  Trophy,
  TrendingUp,
  Settings,
  Shield,
  UserPlus,
  FileText,
  ShieldAlert,
  CreditCard
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Dashboard Admin — CCFO",
  description: "Tableau de bord administrateur de la Coupe Cantonale Fieng Okano",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: teamCount },
    { count: validatedCount },
    { count: playerCount },
    { count: staffCount },
    { count: finishedMatchCount },
    { data: teams },
  ] = await Promise.all([
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'validated'),
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('staff').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('teams').select('name, village, status').order('created_at', { ascending: false }).limit(8),
  ]);

  const stats = [
    { 
      label: "Équipes", 
      value: teamCount || 0, 
      subValue: `${validatedCount || 0} validées`,
      progress: teamCount ? ((validatedCount || 0) / teamCount) * 100 : 0,
      icon: <Shield className="w-5 h-5" />, 
      color: "from-blue-500 to-indigo-600",
      lightColor: "text-blue-400"
    },
    { 
      label: "Joueurs", 
      value: playerCount || 0, 
      subValue: "Licences actives",
      icon: <Users className="w-5 h-5" />, 
      color: "from-emerald-500 to-teal-600",
      lightColor: "text-emerald-400"
    },
    { 
      label: "Staff", 
      value: staffCount || 0, 
      subValue: "Technique",
      icon: <UserPlus className="w-5 h-5" />, 
      color: "from-orange-500 to-amber-600",
      lightColor: "text-amber-400"
    },
    { 
      label: "Matchs", 
      value: finishedMatchCount || 0,
      subValue: "Terminés",
      icon: <Trophy className="w-5 h-5" />, 
      color: "from-primary to-red-600",
      lightColor: "text-primary"
    },
  ];

  const quickActions = [
    { href: "/admin/tournaments", icon: <Settings className="w-5 h-5" />, label: "Configuration", desc: "Paramètres du tournoi" },
    { href: "/admin/teams", icon: <Users className="w-5 h-5" />, label: "Équipes", desc: "Valider les dossiers" },
    { href: "/admin/matches", icon: <Trophy className="w-5 h-5" />, label: "Matchs", desc: "Calendrier & résultats" },
    { href: "/admin/payments", icon: <CreditCard className="w-5 h-5" />, label: "Paiements", desc: "Affiliations & frais" },
    { href: "/admin/documents", icon: <FileText className="w-5 h-5" />, label: "Documents", desc: "Vérifier les pièces" },
    { href: "/admin/suspensions", icon: <ShieldAlert className="w-5 h-5" />, label: "Suspensions", desc: "Cartons & sanctions" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">
          Dashboard Admin
        </h1>
        <p className="text-muted text-sm mt-1">Gestion centrale de la Coupe Cantonale Fieng Okano.</p>
      </div>

      {/* Stats - 2x2 Grid on Mobile, 4 columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-4 md:p-6 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
            {/* Background Glow */}
            <div className={cn("absolute -right-4 -top-4 w-16 h-16 blur-2xl opacity-10 rounded-full bg-linear-to-br", stat.color)} />
            
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-xl bg-linear-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform",
                stat.color
              )}>
                {stat.icon}
              </div>
              <TrendingUp className="w-3 h-3 text-muted opacity-20" />
            </div>

            <div className="space-y-1">
              <div className="text-2xl md:text-4xl font-black font-outfit tracking-tighter leading-none">
                {typeof stat.value === 'number' ? stat.value.toString().padStart(2, '0') : stat.value}
              </div>
              <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted">{stat.label}</div>
            </div>

            {/* Progress Bar for Team Validation */}
            {stat.progress !== undefined ? (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-muted">
                  <span>{stat.subValue}</span>
                  <span>{Math.round(stat.progress)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000 bg-linear-to-r", stat.color)}
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse bg-linear-to-r", stat.color)} />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted">{stat.subValue}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="sports-card p-4 flex flex-col gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div>
                <div className="font-bold text-sm">{action.label}</div>
                <div className="text-[10px] text-muted">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Teams Table - Desktop */}
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
              {(teams || []).map((team: any, i: number) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs shrink-0">{team.name[0]}</div>
                      <span className="font-bold text-sm truncate">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted hidden md:table-cell">{team.village}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      team.status === 'validated' ? "bg-green-500/10 text-green-500" :
                      team.status === 'rejected' ? "bg-red-500/10 text-red-500" :
                      "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {team.status === 'validated' ? 'Validé' : team.status === 'rejected' ? 'Rejeté' : 'Attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teams Cards - Mobile */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-xs">Équipes récentes</h3>
          <Link href="/admin/teams" className="text-[10px] font-black uppercase text-primary">Voir tout</Link>
        </div>
        {(teams || []).map((team: any, i: number) => (
          <div key={i} className="sports-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs shrink-0">{team.name[0]}</div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{team.name}</div>
                <div className="text-[10px] text-muted">{team.village}</div>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ml-2 ${
              team.status === 'validated' ? "bg-green-500/10 text-green-500" :
              team.status === 'rejected' ? "bg-red-500/10 text-red-500" :
              "bg-yellow-500/10 text-yellow-500"
            }`}>
              {team.status === 'validated' ? 'Validé' : team.status === 'rejected' ? 'Rejeté' : 'Attente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
