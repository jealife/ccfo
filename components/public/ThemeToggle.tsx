"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "system" | "dark";

const STORAGE_KEY = "ccfo-theme";

const OPTIONS: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: "light",  icon: Sun,     label: "Clair"  },
  { value: "system", icon: Monitor, label: "Auto"   },
  { value: "dark",   icon: Moon,    label: "Sombre" },
];

function applyTheme(theme: Theme) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-color-scheme");
  } else {
    document.documentElement.setAttribute("data-color-scheme", theme);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      setTheme("system");
    }
    setMounted(true);
  }, []);

  function select(t: Theme) {
    setTheme(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }

  if (!mounted) return null;

  return (
    <div
      role="group"
      aria-label="Thème de l'interface"
      className="flex items-center gap-0.5 p-1 rounded-full bg-white/5 border border-white/10"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            aria-pressed={active}
            title={label}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold",
              "transition-all duration-200 touch-manipulation select-none",
              active
                ? "bg-primary text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            )}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
