"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Award,
  CreditCard,
  FileText,
  Settings,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminMenuLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/tournaments", icon: Settings, label: "Configuration" },
  { href: "/admin/teams", icon: Users, label: "Équipes" },
  { href: "/admin/players", icon: Award, label: "Joueurs" },
  { href: "/admin/staff", icon: Users, label: "Staff" },
  { href: "/admin/matches", icon: Trophy, label: "Matchs & Résultats" },
  { href: "/admin/payments", icon: CreditCard, label: "Paiements" },
  { href: "/admin/documents", icon: FileText, label: "Documents" },
];

const bottomItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Accueil" },
  { href: "/admin/teams", icon: Users, label: "Équipes" },
  { href: "/admin/players", icon: Award, label: "Joueurs" },
];

export function AdminBottomNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* FULLSCREEN ADMIN MOBILE MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-110 bg-background/95 backdrop-blur-xl lg:hidden flex flex-col animate-fade-in">
          <div className="p-6 flex justify-between items-center border-b border-white/5">
            <div>
              <h2 className="text-xl font-black font-outfit uppercase tracking-tighter">Menu Admin</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Administration CCFO26</p>
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)} 
              className="p-2 bg-white/5 rounded-xl text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto pb-32 space-y-2 flex-1">
            {adminMenuLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                    isActive 
                      ? "bg-primary/10 border-primary/30 text-primary" 
                      : "bg-card/50 border-white/5 hover:bg-white/5 text-muted hover:text-foreground"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTTOM NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-100 bg-card/80 backdrop-blur-2xl border-t border-white/5 lg:hidden px-4 pb-safe-area-inset-bottom">
        <div className="flex items-center justify-around h-20">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition-all duration-300 relative",
                  isActive ? "text-primary scale-110" : "text-muted hover:text-white"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  isActive ? "bg-primary/10 text-primary" : "text-muted"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                {isActive && <div className="w-1 h-1 bg-primary rounded-full absolute -bottom-1" />}
              </Link>
            );
          })}

          {/* Menu button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center gap-1.5 transition-all duration-300 text-muted hover:text-white"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Menu className="w-5 h-5 stroke-2" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
