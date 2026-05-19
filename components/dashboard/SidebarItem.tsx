"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant?: "admin" | "manager";
}

export function SidebarItem({ href, icon, label, variant = "admin" }: SidebarItemProps) {
  const pathname = usePathname();
  const depth = href.split("/").filter(Boolean).length;
  const isActive = pathname === href || (depth > 1 && pathname.startsWith(href + "/"));

  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
        isActive 
          ? (variant === "admin" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-secondary text-foreground border border-white/10")
          : "text-muted hover:text-foreground hover:bg-white/5"
      )}
    >
      <div className={cn(
        "transition-colors w-5 h-5 flex items-center justify-center",
        isActive ? "text-white" : "group-hover:text-primary"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-sm font-bold tracking-tight",
        isActive ? "text-white" : ""
      )}>
        {label}
      </span>
    </Link>
  );
}
