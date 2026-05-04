import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  Bell,
  Search,
  PlusCircle,
  Calendar,
  Award,
  Menu,
  CreditCard,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export const metadata = {
  manifest: "/manifest.json",
  themeColor: "#ef4444",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CCFO Gabon",
  },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user?.id)
    .single();

  const userRole = profile?.role || "manager";
  const isAdmin = userRole === "admin";
  const userName = profile?.full_name || "Utilisateur";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - HIDDEN ON MOBILE */}
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-xl fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Image src="/Logo-CCFO-Blanc.png" alt="Logo" width={20} height={20} />
            </div>
            <span className="font-outfit font-bold text-xl tracking-tight uppercase">CCFO</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
          {!isAdmin && (
            <>
              <SidebarItem href="/manager/registration" icon={<PlusCircle />} label="Inscription" />
              <SidebarItem href="/dashboard/my-team" icon={<Users />} label="Mon Équipe" />
            </>
          )}
          <SidebarItem href="/dashboard/matches" icon={<Calendar />} label="Matchs" />
          
          {isAdmin && (
            <div className="pt-8">
              <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted mb-4">Administration</p>
              <SidebarItem href="/admin/tournaments" icon={<Settings />} label="Configuration" />
              <SidebarItem href="/admin/teams" icon={<Users />} label="Équipes" />
              <SidebarItem href="/admin/players" icon={<Award />} label="Joueurs" />
              <SidebarItem href="/admin/staff" icon={<Users />} label="Staff" />
              <SidebarItem href="/admin/matches" icon={<Trophy />} label="Matchs & Résultats" />
              <SidebarItem href="/admin/payments" icon={<CreditCard />} label="Paiements" />
              <SidebarItem href="/admin/documents" icon={<FileText />} label="Documents" />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/logout" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-red-500 hover:bg-red-500/5 transition-all font-medium">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-0">
        {/* Top Bar */}
        <header className="h-16 lg:h-20 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Logo/Brand */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Image src="/Logo-CCFO-Blanc.png" alt="Logo" width={18} height={18} />
              </div>
              <span className="font-outfit font-bold text-lg tracking-tight uppercase">CCFO</span>
            </div>
            
            {/* Desktop Search */}
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:border-primary outline-none transition-all w-64"
              />
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
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{userRole}</p>
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

      {/* Mobile PWA Elements */}
      <BottomNav isAdmin={isAdmin} />
      <InstallPrompt />
    </div>
  );
}

function SidebarItem({ href, icon, label }: any) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-muted hover:text-foreground hover:bg-white/5 group"
    >
      <div className="group-hover:text-primary transition-colors">{icon}</div>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
