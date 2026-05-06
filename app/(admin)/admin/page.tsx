import { createClient } from "@/lib/supabase/server";
import { 
  Users, 
  Trophy, 
  TrendingUp,
  Settings,
  Calendar
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Dashboard Admin — CCFO",
  description: "Tableau de bord administrateur de la Coupe Cantonale Fieng Okano",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  const { count: validatedCount } = await supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'validated');
  const { count: matchCount } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished');
  const { data: teams } = await supabase
    .from('teams')
    .select('name, village, status, president_name')
    .order('created_at', { ascending: false })
    .limit(8);

  const stats = [
    { label: "Équipes", value: teamCount || 0, icon: <Users />, trend: "Inscrites", color: "text-blue-400" },
    { label: "Validées", value: validatedCount || 0, icon: <Trophy />, trend: "Paiements confirmés", color: "text-green-400" },
    { label: "Matchs Joués", value: matchCount || 0, icon: <Calendar />, trend: "Terminés", color: "text-accent" },
  ];

  const quickActions = [
    { href: "/admin/tournaments", icon: <Settings className="w-5 h-5" />, label: "Configuration tournoi", desc: "Gérer les paramètres" },
    { href: "/admin/teams", icon: <Users className="w-5 h-5" />, label: "Gérer les équipes", desc: "Valider les dossiers" },
    { href: "/admin/matches", icon: <Trophy className="w-5 h-5" />, label: "Programmer matchs", desc: "Calendrier & résultats" },
    { href: "/admin/payments", icon: <TrendingUp className="w-5 h-5" />, label: "Suivi paiements", desc: "Affiliations & frais" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">
          Dashboard Admin
        </h1>
        <p className="text-muted text-sm mt-1">Gestion centrale de la Coupe Cantonale Fieng Okano.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-4 md:p-6 group hover:border-primary/30 transition-all duration-500">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-accent opacity-20" />
            </div>
            <div className="text-2xl md:text-4xl font-black font-outfit tracking-tighter mb-0.5">{stat.value}</div>
            <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted leading-tight">{stat.label}</div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] md:text-[9px] font-black text-green-500 uppercase tracking-widest">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                      team.status === 'validated' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {team.status === 'validated' ? 'Validé' : 'Attente'}
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
              team.status === 'validated' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
            }`}>
              {team.status === 'validated' ? 'Validé' : 'Attente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
