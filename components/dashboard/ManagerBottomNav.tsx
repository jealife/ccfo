"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Calendar,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ManagerBottomNav({ teamStatus }: { teamStatus?: string | null }) {
  const pathname = usePathname();

  const registrationDone = teamStatus === 'pending' || teamStatus === 'validated' || teamStatus === 'locked';

  const items = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Accueil" },
    registrationDone
      ? { href: "/manager/registration", icon: FileText, label: "Dossier" }
      : { href: "/manager/registration", icon: PlusCircle, label: "S'inscrire" },
    { href: "/dashboard/my-team", icon: Users, label: "Équipe" },
    { href: "/dashboard/matches", icon: Calendar, label: "Calendrier" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-100 bg-card/80 backdrop-blur-2xl border-t border-white/5 lg:hidden px-4 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-20">
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href + item.label}
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
      </div>
    </nav>
  );
}
