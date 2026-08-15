"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X, AlertTriangle, FileWarning, LockOpen, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export type ManagerNotifType = "rejected" | "missing_docs" | "roster_reopened" | "match_soon";

export type ManagerNotification = {
  id: string;
  type: ManagerNotifType;
  title: string;
  subtitle: string;
  href: string;
};

const ICONS: Record<ManagerNotifType, React.ElementType> = {
  rejected: AlertTriangle,
  missing_docs: FileWarning,
  roster_reopened: LockOpen,
  match_soon: CalendarClock,
};

const COLORS: Record<ManagerNotifType, string> = {
  rejected: "bg-red-500/10 text-red-500",
  missing_docs: "bg-yellow-500/10 text-yellow-500",
  roster_reopened: "bg-blue-500/10 text-blue-400",
  match_soon: "bg-primary/10 text-primary",
};

export function ManagerNotifBell({ items }: { items: ManagerNotification[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-white/5 transition-all"
      >
        <Bell className="w-5 h-5" />
        {items.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-accent rounded-full border-2 border-background flex items-center justify-center text-[8px] font-black text-background leading-none">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest">Notifications</p>
            <button type="button" onClick={() => setOpen(false)} title="Fermer les notifications" aria-label="Fermer les notifications" className="text-muted hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {items.length > 0 ? (
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {items.map((item) => {
                const Icon = ICONS[item.type];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", COLORS[item.type])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{item.title}</p>
                      <p className="text-[10px] text-muted mt-0.5">{item.subtitle}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <Bell className="w-8 h-8 mx-auto text-muted/20" />
              <p className="text-sm text-muted italic">Aucune notification</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
