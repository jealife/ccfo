"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Search,
  X,
  LogOut,
  ChevronDown,
  Loader2,
  Users,
  User,
  Clock,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/api/auth/actions";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/tournaments": "Configuration",
  "/admin/teams": "Équipes",
  "/admin/players": "Joueurs",
  "/admin/staff": "Staff",
  "/admin/matches": "Matchs & Résultats",
  "/admin/payments": "Paiements",
  "/admin/documents": "Documents",
  "/admin/suspensions": "Suspensions",
};

interface SearchResult {
  type: "team" | "player";
  id: string;
  label: string;
  sub: string;
  href: string;
}

interface AdminTopBarProps {
  userName: string;
  pendingCount: number;
}

export function AdminTopBar({ userName, pendingCount }: AdminTopBarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  // Page title — exact match first, then prefix (for /admin/matches/[id] etc.)
  const pageTitle =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES)
      .filter(([key]) => key !== "/admin")
      .find(([key]) => pathname.startsWith(key))?.[1] ||
    "Admin";

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Dropdown states
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape closes everything
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchFocused(false);
        setSearchQuery("");
        setMobileSearchOpen(false);
        setNotifOpen(false);
        setAvatarOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus mobile search when overlay opens
  useEffect(() => {
    if (mobileSearchOpen) setTimeout(() => mobileSearchRef.current?.focus(), 50);
  }, [mobileSearchOpen]);

  // Debounced search
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    const [teamsRes, playersRes] = await Promise.all([
      supabase.from("teams").select("id, name, village, status").ilike("name", `%${q}%`).limit(4),
      supabase.from("players").select("id, full_name, teams(name)").ilike("full_name", `%${q}%`).limit(4),
    ]);
    setSearchResults([
      ...(teamsRes.data || []).map((t) => ({
        type: "team" as const,
        id: t.id,
        label: t.name,
        sub: t.village,
        href: "/admin/teams",
      })),
      ...(playersRes.data || []).map((p) => ({
        type: "player" as const,
        id: p.id,
        label: p.full_name,
        sub: (p.teams as unknown as { name: string } | null)?.name ?? "—",
        href: "/admin/players",
      })),
    ]);
    setSearchLoading(false);
    // supabase est un client stable créé une fois par module
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => performSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, performSearch]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchFocused(false);
    setMobileSearchOpen(false);
  };

  const showResults = (searchFocused || mobileSearchOpen) && searchQuery.length > 0;

  return (
    <>
      <header className="h-16 lg:h-20 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">

        {/* ── LEFT ── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile: logo + page title */}
          <div className="lg:hidden flex items-center gap-3 min-w-0">
            <Link href="/admin" className="shrink-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Image src="/Logo-CCFO-Blanc.png" alt="Logo" width={18} height={18} />
              </div>
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-tight truncate">{pageTitle}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-primary leading-none">Admin</p>
            </div>
          </div>

          {/* Desktop: search */}
          <div ref={searchContainerRef} className="relative hidden lg:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              ref={desktopSearchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Rechercher équipe, joueur..."
              className={cn(
                "pl-10 pr-8 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:border-primary/50 outline-none transition-all",
                searchFocused ? "w-80" : "w-64"
              )}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Desktop results dropdown */}
            {showResults && !mobileSearchOpen && (
              <SearchDropdown
                loading={searchLoading}
                results={searchResults}
                query={searchQuery}
                onSelect={clearSearch}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-1 lg:gap-2">

          {/* Mobile search button */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="lg:hidden p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((v) => !v); setAvatarOpen(false); }}
              className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-white/5 transition-all"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-accent rounded-full border-2 border-background flex items-center justify-center text-[8px] font-black text-background leading-none">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest">Notifications</p>
                  <button onClick={() => setNotifOpen(false)} className="text-muted hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {pendingCount > 0 ? (
                  <Link
                    href="/admin/teams"
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center gap-3 px-4 py-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">
                        {pendingCount} équipe{pendingCount > 1 ? "s" : ""} en attente
                      </p>
                      <p className="text-[10px] text-muted">Validation de dossier requise</p>
                    </div>
                  </Link>
                ) : (
                  <div className="py-10 text-center space-y-2">
                    <Bell className="w-8 h-8 mx-auto text-muted/20" />
                    <p className="text-sm text-muted italic">Aucune notification</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-white/5 hidden lg:block mx-1" />

          {/* Avatar dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => { setAvatarOpen((v) => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-tight">{userName}</p>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest">Admin</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                {userName[0]}
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform hidden sm:block", avatarOpen && "rotate-180")} />
            </button>

            {avatarOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-bold truncate">{userName}</p>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">Administrateur</p>
                </div>
                <div className="py-2">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-bold">Déconnexion</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Search Overlay ── */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl lg:hidden flex flex-col animate-fade-in">
          {/* Search input bar */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
            <Search className="w-5 h-5 text-muted shrink-0" />
            <input
              ref={mobileSearchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher équipe, joueur..."
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            />
            <button onClick={clearSearch} className="p-1 text-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile results */}
          <div className="flex-1 overflow-y-auto p-4">
            {!searchQuery ? (
              <p className="text-sm text-muted text-center mt-12">Tapez pour rechercher...</p>
            ) : searchLoading ? (
              <div className="flex justify-center mt-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-muted text-center mt-12">Aucun résultat pour «{searchQuery}»</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((r) => (
                  <Link
                    key={r.type + r.id}
                    href={r.href}
                    onClick={clearSearch}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-white/5 hover:border-primary/30 transition-all"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0",
                      r.type === "team" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                    )}>
                      {r.type === "team" ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{r.label}</p>
                      <p className="text-[10px] text-muted truncate">
                        {r.type === "team" ? "Équipe" : "Joueur"} · {r.sub}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SearchDropdown({ loading, results, query, onSelect }: {
  loading: boolean;
  results: SearchResult[];
  query: string;
  onSelect: () => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted" />
        </div>
      ) : results.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">
          Aucun résultat pour «{query}»
        </div>
      ) : (
        <div className="py-2">
          {results.map((r) => (
            <Link
              key={r.type + r.id}
              href={r.href}
              onClick={onSelect}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                r.type === "team" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
              )}>
                {r.type === "team" ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{r.label}</p>
                <p className="text-[10px] text-muted truncate">
                  {r.type === "team" ? "Équipe" : "Joueur"} · {r.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
