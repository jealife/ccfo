"use client";

import React, { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  PlusCircle,
  Calendar,
  Menu,
  X,
  Settings,
  Award,
  CreditCard,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const items = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Accueil" },
    ...(isAdmin ? [
      { href: "/admin/teams", icon: Users, label: "Équipes" },
      { href: "/admin/players", icon: Award, label: "Joueurs" },
      { isAction: true, action: () => setIsMenuOpen(true), icon: Menu, label: "Menu" },
    ] : [
      { href: "/manager/registration", icon: PlusCircle, label: "S'inscrire" },
      { href: "/dashboard/my-team", icon: Users, label: "Équipe" },
      { href: "/dashboard/matches", icon: Calendar, label: "Calendrier" },
    ])
  ];

  const adminMenuLinks = [
    { href: "/admin/tournaments", icon: Settings, label: "Configuration" },
    { href: "/admin/teams", icon: Users, label: "Équipes" },
    { href: "/admin/players", icon: Award, label: "Joueurs" },
    { href: "/admin/staff", icon: Users, label: "Staff" },
    { href: "/admin/matches", icon: Trophy, label: "Matchs & Résultats" },
    { href: "/admin/payments", icon: CreditCard, label: "Paiements" },
    { href: "/admin/documents", icon: FileText, label: "Documents" },
  ];

  return (
    <>
      {/* FULLSCREEN MOBILE MENU FOR ADMIN */}
      {isAdmin && isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-xl lg:hidden flex flex-col animate-fade-in">
          <div className="p-6 flex justify-between items-center border-b border-white/5">
            <h2 className="text-xl font-black font-outfit uppercase tracking-tighter">Menu Admin</h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/5 rounded-xl text-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto pb-32 space-y-2 flex-1">
            {adminMenuLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-white/5 hover:bg-white/5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="font-bold">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card/80 backdrop-blur-2xl border-t border-white/5 lg:hidden px-4 pb-safe-area-inset-bottom">
        <div className="flex items-center justify-around h-20">
          {items.map((item, idx) => {
            const isActive = item.href ? pathname === item.href : false;
            
            const content = (
              <>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  isActive ? "bg-primary/10 text-primary" : "text-muted"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-primary rounded-full absolute -bottom-1" />
                )}
              </>
            );

            if (item.isAction) {
              return (
                <button 
                  key={`action-${idx}`}
                  onClick={item.action}
                  className="flex flex-col items-center gap-1.5 transition-all duration-300 text-muted hover:text-white relative"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link 
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition-all duration-300 relative",
                  isActive ? "text-primary scale-110" : "text-muted hover:text-white"
                )}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
