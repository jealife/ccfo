"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, BarChart3, Menu, LogIn, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-100 bg-background/50 backdrop-blur-2xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group relative z-110">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
              <Image src="/Logo-CCFO-Blanc.png" alt="Logo" width={24} height={24} className="brightness-200" />
            </div>
            <div className="flex flex-col">
              <span className="font-outfit font-black text-2xl tracking-tighter leading-none">CCFO26</span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Fieng Okano</span>
            </div>
          </Link>

          {/* Desktop Nav: Center */}
          <div className="hidden lg:flex items-center gap-10 bg-white/5 px-8 py-2 rounded-full border border-white/5 backdrop-blur-xl">
            <NavLink href="/" active={pathname === "/"} icon={<Trophy className="w-4 h-4" />}>Accueil</NavLink>
            <NavLink href="/matches" active={pathname.startsWith("/matches")} icon={<Calendar className="w-4 h-4" />}>Matchs</NavLink>
            <NavLink href="/standings" active={pathname.startsWith("/standings")} icon={<BarChart3 className="w-4 h-4" />}>Classement</NavLink>
            <NavLink href="/teams" active={pathname.startsWith("/teams")} icon={<Users className="w-4 h-4" />}>Équipes</NavLink>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* S'inscrire — desktop only, accessible via menu on mobile */}
            <Link
              href="/register"
              className="hidden lg:flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors"
            >
              S'inscrire
            </Link>
            {/* Login — full label on desktop, icon-only on mobile */}
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 lg:px-6 py-2.5 rounded-full bg-white text-background text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-500 shadow-xl shadow-white/5 hover:shadow-primary/20"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden lg:inline">Espace Équipe</span>
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-white bg-white/5 rounded-xl border border-white/10 relative z-110"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 z-90 bg-background/95 backdrop-blur-2xl transition-all duration-700 lg:hidden",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="flex flex-col h-full pt-32 px-8 pb-10">
          <div className="space-y-4">
            <MobileNavLink href="/" active={pathname === "/"} label="Accueil" icon={<Trophy />} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/matches" active={pathname.startsWith("/matches")} label="Matchs" icon={<Calendar />} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/standings" active={pathname.startsWith("/standings")} label="Classement" icon={<BarChart3 />} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/teams" active={pathname.startsWith("/teams")} label="Équipes" icon={<Users />} onClick={() => setIsOpen(false)} />
          </div>

          <div className="mt-auto space-y-4">
            <Link 
              href="/register"
              onClick={() => setIsOpen(false)}
              className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black uppercase tracking-widest text-xs"
            >
              S'inscrire
            </Link>
            <Link 
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full py-5 rounded-2xl bg-primary text-white flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20"
            >
              <LogIn className="w-5 h-5" />
              Espace Équipe
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function NavLink({ href, icon, children, active }: { href: string; icon: React.ReactNode; children: React.ReactNode, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all group relative py-2",
        active ? "text-primary" : "text-muted hover:text-primary"
      )}
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span>{children}</span>
      <div className={cn(
        "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-500",
        active ? "w-full" : "w-0 group-hover:w-full"
      )} />
    </Link>
  );
}

function MobileNavLink({ href, label, icon, onClick, active }: { href: string; label: string; icon: React.ReactNode; onClick: () => void, active?: boolean }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-6 rounded-2xl bg-white/5 border transition-all group",
        active ? "border-primary/50 bg-primary/5" : "border-white/5 hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          active ? "bg-primary text-white" : "bg-white/5 text-primary"
        )}>
          {icon}
        </div>
        <span className={cn(
          "text-xl font-black font-outfit uppercase tracking-tight",
          active ? "text-white" : "text-muted group-hover:text-white"
        )}>{label}</span>
      </div>
      <ChevronRight className={cn(
        "w-5 h-5 transition-all",
        active ? "text-primary translate-x-1" : "text-muted group-hover:text-primary group-hover:translate-x-1"
      )} />
    </Link>
  );
}
