import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Calendar,
  PlusCircle,
  Receipt,
  ShieldAlert
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/api/auth/actions";
import { returnToAdmin } from "@/app/api/teams/actions";
import { ManagerBottomNav } from "@/components/dashboard/ManagerBottomNav";
import { SidebarItem } from "@/components/dashboard/SidebarItem";
import { ManagerNotifBell, type ManagerNotification } from "@/components/dashboard/ManagerNotifBell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { formatFrenchDate, formatFrenchTime } from "@/lib/helpers";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ef4444",
};

/** Heures restantes avant un match, à partir de maintenant. */
function hoursUntil(matchDate: string): number {
  return (new Date(matchDate).getTime() - Date.now()) / 3_600_000;
}

export const metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CCFO26 Manager",
  },
};

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user?.id)
    .single();

  // Redirect admins to their dashboard
  if (profile?.role === "admin") redirect("/admin");

  const userName = profile?.full_name || "Manager";

  // Présent uniquement quand un admin consulte cet espace via "Espace manager"
  // (voir impersonateManager) — permet de revenir à sa session admin.
  const cookieStore = await cookies();
  const isImpersonatedByAdmin = !!cookieStore.get("ccfo_admin_stash")?.value;

  const { data: team } = await supabase
    .from('teams')
    .select('id, status, registration_unlocked, payment_receipt_url')
    .eq('manager_id', user?.id)
    .maybeSingle();

  const notifications: ManagerNotification[] = [];

  if (team) {
    if (team.status === 'rejected') {
      notifications.push({
        id: 'rejected',
        type: 'rejected',
        title: 'Dossier rejeté',
        subtitle: "Corrigez les éléments signalés puis renvoyez votre dossier.",
        href: '/manager/registration',
      });
    }

    if (['validated', 'locked'].includes(team.status) && team.registration_unlocked) {
      notifications.push({
        id: 'roster_reopened',
        type: 'roster_reopened',
        title: "Effectif rouvert par l'administration",
        subtitle: "Vous pouvez de nouveau ajouter ou retirer des joueurs et membres du staff.",
        href: '/dashboard/my-team',
      });
    }

    if (team.status === 'incomplete') {
      const [{ count: staffMissing }, { count: playersMissing }] = await Promise.all([
        supabase.from('staff').select('id', { count: 'exact', head: true }).eq('team_id', team.id).is('identity_docs_url', null),
        supabase.from('players').select('id', { count: 'exact', head: true }).eq('team_id', team.id).is('identity_docs_url', null),
      ]);
      const missingDocs = (staffMissing || 0) + (playersMissing || 0) + (team.payment_receipt_url ? 0 : 1);
      if (missingDocs > 0) {
        notifications.push({
          id: 'missing_docs',
          type: 'missing_docs',
          title: `${missingDocs} document${missingDocs > 1 ? 's' : ''} manquant${missingDocs > 1 ? 's' : ''}`,
          subtitle: "Pièces d'identité ou preuve de paiement à compléter avant validation.",
          href: '/dashboard/my-team',
        });
      }
    }

    const { data: nextMatch } = await supabase
      .from('matches')
      .select('id, match_date, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .in('status', ['scheduled', 'live'])
      .order('match_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextMatch?.match_date) {
      const hours = hoursUntil(nextMatch.match_date);
      if (hours >= 0 && hours <= 48) {
        const home = (nextMatch.home as unknown as { name: string } | null)?.name ?? "?";
        const away = (nextMatch.away as unknown as { name: string } | null)?.name ?? "?";
        notifications.push({
          id: 'match_soon',
          type: 'match_soon',
          title: `Match dans ${hours < 1 ? "moins d'1h" : `${Math.round(hours)}h`}`,
          subtitle: `${home} vs ${away} — ${formatFrenchDate(nextMatch.match_date, { day: '2-digit', month: '2-digit' })} à ${formatFrenchTime(nextMatch.match_date)}`,
          href: `/matches/${nextMatch.id}`,
        });
      }
    }
  }

  const navLinks = [
    { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
    { href: "/manager/registration", icon: <PlusCircle />, label: "Inscription" },
    { href: "/dashboard/my-team", icon: <Users />, label: "Mon Équipe" },
    { href: "/dashboard/matches", icon: <Calendar />, label: "Calendrier" },
    // Le reçu officiel n'existe qu'une fois l'équipe validée par l'administration.
    ...(team?.status === "validated"
      ? [{ href: "/dashboard/receipt", icon: <Receipt />, label: "Mon Reçu" }]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-background" data-theme="admin">
      {/* Manager Sidebar - HIDDEN ON MOBILE */}
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-xl fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Image src="/Logo-CCFO-Blanc.png" alt="Logo" width={20} height={20} />
            </div>
            <div>
              <span className="font-outfit font-bold text-xl tracking-tight uppercase">CCFO</span>
              <span className="block text-[9px] font-black uppercase tracking-widest text-muted">Matora2026</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted mb-3">Navigation</p>
          {navLinks.map((link) => (
            <SidebarItem key={link.href} href={link.href} icon={link.icon} label={link.label} variant="manager" />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center font-bold text-sm">
              {userName[0]}
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">{userName}</p>
              <p className="text-[9px] text-muted font-black uppercase tracking-widest">Manager</p>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-red-500 hover:bg-red-500/5 transition-all font-medium text-sm">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-0">
        {/* Top Bar */}
        <header className="h-16 lg:h-20 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Image src="/Logo-CCFO-Blanc.png" alt="Logo" width={18} height={18} />
              </div>
              <span className="font-outfit font-bold text-lg tracking-tight uppercase">CCFO26</span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <ManagerNotifBell items={notifications} />
            <div className="h-8 w-px bg-white/5 hidden lg:block" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-tight">{userName}</p>
                <p className="text-[10px] text-muted font-black uppercase tracking-widest">Manager</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-sm">
                {userName[0]}
              </div>
            </div>
          </div>
        </header>

        {isImpersonatedByAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-8 py-3 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500">
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Vous consultez cet espace en tant qu&apos;administrateur, connecté(e) sous ce manager.
            </div>
            <form action={returnToAdmin}>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors">
                Retour à l&apos;administration
              </button>
            </form>
          </div>
        )}

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile PWA */}
      <ManagerBottomNav teamStatus={team?.status} />
      <InstallPrompt />
    </div>
  );
}
