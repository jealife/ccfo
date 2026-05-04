"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, BarChart3, Menu, LogIn, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

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
              <span className="font-outfit font-black text-2xl tracking-tighter leading-none">CCFO</span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">Okano 2026</span>
            </div>
          </Link>

          {/* Desktop Nav: Center */}
          <div className="hidden lg:flex items-center gap-10 bg-white/5 px-8 py-2 rounded-full border border-white/5 backdrop-blur-xl">
            <NavLink href="/" icon={<Trophy className="w-4 h-4" />}>Accueil</NavLink>
            <NavLink href="/matches" icon={<Calendar className="w-4 h-4" />}>Matchs</NavLink>
            <NavLink href="/standings" icon={<BarChart3 className="w-4 h-4" />}>Classement</NavLink>
            <NavLink href="/teams" icon={<Users className="w-4 h-4" />}>Équipes</NavLink>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <Link 
              href="/register" 
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors"
            >
              S'inscrire
            </Link>
            <Link 
              href="/login" 
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-background text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-500 shadow-xl shadow-white/5 hover:shadow-primary/20"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden xs:inline">Espace Équipe</span>
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
            <MobileNavLink href="/" label="Accueil" icon={<Trophy />} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/matches" label="Matchs" icon={<Calendar />} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/standings" label="Classement" icon={<BarChart3 />} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/teams" label="Équipes" icon={<Users />} onClick={() => setIsOpen(false)} />
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

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-all group relative py-2"
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span>{children}</span>
      <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-500 group-hover:w-full" />
    </Link>
  );
}

function MobileNavLink({ href, label, icon, onClick }: { href: string; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 group transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
          {icon}
        </div>
        <span className="text-xl font-black font-outfit uppercase tracking-tight">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
