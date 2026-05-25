import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Bell,
  Calendar,
  PlusCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ManagerBottomNav } from "@/components/dashboard/ManagerBottomNav";
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

  const { data: team } = await supabase
    .from('teams')
    .select('status')
    .eq('manager_id', user?.id)
    .maybeSingle();

  const navLinks = [
    { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
    { href: "/manager/registration", icon: <PlusCircle />, label: "Inscription" },
    { href: "/dashboard/my-team", icon: <Users />, label: "Mon Équipe" },
    { href: "/dashboard/matches", icon: <Calendar />, label: "Calendrier" },
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
              <span className="font-outfit font-bold text-xl tracking-tight uppercase">CCFO26</span>
              <span className="block text-[9px] font-black uppercase tracking-widest text-muted">Manager</span>
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
          <Link href="/logout" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-red-500 hover:bg-red-500/5 transition-all font-medium text-sm">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Link>
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
            <button className="relative p-2 text-muted hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background" />
            </button>
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
