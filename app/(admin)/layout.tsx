import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Settings,
  LogOut,
  Award,
  CreditCard,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminBottomNav } from "@/components/dashboard/AdminBottomNav";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { SidebarItem } from "@/components/dashboard/SidebarItem";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { redirect } from "next/navigation";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ef4444",
};

export const metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CCFO26 Admin",
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user?.id)
    .single();

  // Redirect non-admins away
  if (profile?.role !== "admin") redirect("/dashboard");

  const userName = profile?.full_name || "Admin";

  const { count: pendingCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const navLinks = [
    { href: "/admin", icon: <LayoutDashboard />, label: "Dashboard" },
    { href: "/admin/tournaments", icon: <Settings />, label: "Configuration" },
    { href: "/admin/teams", icon: <Users />, label: "Équipes" },
    { href: "/admin/players", icon: <Award />, label: "Joueurs" },
    { href: "/admin/staff", icon: <Users />, label: "Staff" },
    { href: "/admin/matches", icon: <Trophy />, label: "Matchs & Résultats" },
    { href: "/admin/payments", icon: <CreditCard />, label: "Paiements" },
    { href: "/admin/documents", icon: <FileText />, label: "Documents" },
    { href: "/admin/suspensions", icon: <ShieldAlert />, label: "Suspensions" },
  ];

  return (
    <div className="flex min-h-screen bg-background" data-theme="admin">
      {/* Admin Sidebar - HIDDEN ON MOBILE */}
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-xl fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Image src="/Logo-CCFO-Blanc.png" alt="Logo" width={20} height={20} />
            </div>
            <div>
              <span className="font-outfit font-bold text-xl tracking-tight uppercase">CCFO26</span>
              <span className="block text-[9px] font-black uppercase tracking-widest text-primary">Administration</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted mb-3">Menu Admin</p>
          {navLinks.map((link) => (
            <SidebarItem key={link.href} href={link.href} icon={link.icon} label={link.label} variant="admin" />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary">
              {userName[0]}
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">{userName}</p>
              <p className="text-[9px] text-primary font-black uppercase tracking-widest">Admin</p>
            </div>
          </div>
          <Link href="/logout" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-red-500 hover:bg-red-500/5 transition-all font-medium text-sm">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-0">
        <AdminTopBar userName={userName} pendingCount={pendingCount ?? 0} />

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile PWA */}
      <AdminBottomNav />
      <InstallPrompt />
    </div>
  );
}
