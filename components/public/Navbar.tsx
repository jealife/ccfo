"use client";

import Link from "next/link";
import { Trophy, Calendar, Users, BarChart3, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Top Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Image src="/Logo-CCFO-Blanc.png" alt="Logo CCFO" width={22} height={22} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[17px] tracking-tight text-foreground font-outfit">
                CC<span className="text-primary">FO26</span>
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted">Fieng Okano</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink href="/" active={pathname === "/"} icon={<Trophy className="w-4 h-4" />}>Accueil</NavLink>
            <NavLink href="/matches" active={pathname.startsWith("/matches")} icon={<Calendar className="w-4 h-4" />}>Matchs</NavLink>
            <NavLink href="/standings" active={pathname.startsWith("/standings")} icon={<BarChart3 className="w-4 h-4" />}>Classement</NavLink>
            <NavLink href="/teams" active={pathname.startsWith("/teams")} icon={<Users className="w-4 h-4" />}>Équipes</NavLink>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-muted hover:text-foreground transition-colors"
            >
              S&apos;inscrire
            </Link>
            <Link
              href="/login"
              aria-label="Espace Équipe"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/20 touch-manipulation"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden lg:inline">Espace Équipe</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Tab Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden pb-env-safe">
        <div className="flex items-stretch">
          <BottomNavItem href="/"          icon={Trophy}   label="Accueil"    active={pathname === "/"} />
          <BottomNavItem href="/matches"   icon={Calendar}  label="Matchs"     active={pathname.startsWith("/matches")} />
          <BottomNavItem href="/standings" icon={BarChart3} label="Classement" active={pathname.startsWith("/standings")} />
          <BottomNavItem href="/teams"     icon={Users}     label="Équipes"    active={pathname.startsWith("/teams")} />
        </div>
      </nav>
    </>
  );
}

function NavLink({
  href, icon, children, active,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted hover:text-foreground hover:bg-secondary"
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

function BottomNavItem({
  href, icon: Icon, label, active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px]",
        "transition-colors active:bg-secondary/60 touch-manipulation",
        active ? "text-primary" : "text-muted"
      )}
    >
      <div className={cn(
        "w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
        active && "bg-primary/10"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn(
        "text-[10px] font-bold leading-none",
        active ? "text-primary" : "text-muted"
      )}>
        {label}
      </span>
    </Link>
  );
}
