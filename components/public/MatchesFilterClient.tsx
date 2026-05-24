"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { MatchTimer } from "./MatchTimer";

export function MatchesFilterClient({ initialMatches }: { initialMatches: any[] }) {
  const [filter, setFilter] = useState("Tous");

  const filters = [
    { label: "Tous",     value: "Tous" },
    { label: "Live",     value: "live" },
    { label: "Terminés", value: "finished" },
    { label: "À venir",  value: "scheduled" },
  ];

  const filteredMatches = (initialMatches || []).filter((match: any) =>
    filter === "Tous" || match.status === filter
  );

  const groupedMatches = filteredMatches.reduce((acc: Record<string, any[]>, match: any) => {
    const d = new Date(match.match_date);
    let label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    label = label.charAt(0).toUpperCase() + label.slice(1);
    if (!acc[label]) acc[label] = [];
    acc[label].push(match);
    return acc;
  }, {});

  return (
    <div className="space-y-8">

      {/* ── Filtres pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn("pill-filter", filter === f.value ? "pill-active" : "pill-inactive")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Groupes par date ── */}
      <div className="space-y-10">
        {Object.keys(groupedMatches).map((dateStr, i) => (
          <div key={i} className="space-y-3 animate-fade-in">

            {/* Date header */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border shrink-0">
                <Calendar className="w-3 h-3 text-muted" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">{dateStr}</h3>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Match cards */}
            <div className="space-y-2.5">
              {groupedMatches[dateStr].map((match: any) => {
                const isLive     = match.status === "live";
                const isFinished = match.status === "finished";
                const matchDate  = new Date(match.match_date);
                const time       = matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                const startedAt  = match.stats?.find((s: any) => s.label === "started_at")?.value;

                return (
                  <Link href={`/matches/${match.id}`} key={match.id} className="block touch-manipulation group">
                    <div className={cn(
                      "bg-card rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer overflow-hidden",
                      "hover:shadow-md active:scale-[0.99]",
                      isLive
                        ? "border-primary/30 hover:border-primary/50"
                        : "border-border hover:border-primary/20"
                    )}>

                      {/* Live accent bar */}
                      {isLive && (
                        <div className="h-0.5 w-full bg-primary" />
                      )}

                      <div className="flex items-center gap-0">

                        {/* ── Status column ── */}
                        <div className="w-[72px] md:w-28 flex flex-col items-center justify-center gap-1 shrink-0 py-4 md:py-5 px-2 md:px-4 border-r border-border self-stretch">
                          {isLive ? (
                            <>
                              <span className="flex items-center gap-1 text-[10px] md:text-xs font-black text-primary uppercase tracking-tight">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                                Live
                              </span>
                              <MatchTimer startedAt={startedAt} status={match.status} />
                            </>
                          ) : isFinished ? (
                            <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] md:text-xs font-black text-muted uppercase tracking-tight">
                              FIN
                            </span>
                          ) : (
                            <>
                              <span className="text-sm md:text-base font-black text-accent tabular-nums">{time}</span>
                              <span className="text-[9px] font-bold text-muted uppercase tracking-widest hidden md:block">
                                Prévu
                              </span>
                            </>
                          )}
                        </div>

                        {/* ── Corps du match ── */}
                        <div className="flex-1 flex items-center gap-3 md:gap-5 px-3 md:px-6 py-4 md:py-5 min-w-0">

                          {/* Équipe domicile */}
                          <div className="flex-1 flex items-center justify-end gap-2 md:gap-3 min-w-0">
                            <span className={cn(
                              "font-bold text-sm md:text-base text-foreground truncate text-right leading-tight",
                              isLive && "text-primary"
                            )}>
                              {match.home?.name ?? "—"}
                            </span>
                            <div className={cn(
                              "w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-sm md:text-lg border-2 shrink-0 transition-transform group-hover:scale-105 duration-200",
                              isLive
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-secondary border-border text-foreground"
                            )}>
                              {match.home?.name?.[0] ?? "?"}
                            </div>
                          </div>

                          {/* Score */}
                          <div className={cn(
                            "flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl border shrink-0",
                            "min-w-[72px] md:min-w-[100px] justify-center",
                            isLive
                              ? "bg-primary/10 border-primary/25"
                              : isFinished
                              ? "bg-secondary border-border"
                              : "bg-secondary border-border"
                          )}>
                            <span className={cn(
                              "text-lg md:text-2xl font-black tabular-nums font-outfit",
                              isLive ? "text-primary"
                              : isFinished ? "text-foreground"
                              : "text-muted/60"
                            )}>
                              {match.status === "scheduled" ? "—" : match.home_score ?? 0}
                            </span>
                            <span className="text-muted/40 font-black text-lg md:text-xl">:</span>
                            <span className={cn(
                              "text-lg md:text-2xl font-black tabular-nums font-outfit",
                              isLive ? "text-primary"
                              : isFinished ? "text-foreground"
                              : "text-muted/60"
                            )}>
                              {match.status === "scheduled" ? "—" : match.away_score ?? 0}
                            </span>
                          </div>

                          {/* Équipe extérieure */}
                          <div className="flex-1 flex items-center justify-start gap-2 md:gap-3 min-w-0">
                            <div className={cn(
                              "w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-sm md:text-lg border-2 shrink-0 transition-transform group-hover:scale-105 duration-200",
                              isLive
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-secondary border-border text-foreground"
                            )}>
                              {match.away?.name?.[0] ?? "?"}
                            </div>
                            <span className={cn(
                              "font-bold text-sm md:text-base text-foreground truncate leading-tight",
                              isLive && "text-primary"
                            )}>
                              {match.away?.name ?? "—"}
                            </span>
                          </div>
                        </div>

                        {/* Chevron */}
                        <div className="pr-4 md:pr-5 pl-1 shrink-0 self-stretch flex items-center">
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-border group-hover:text-primary transition-colors duration-200" />
                        </div>

                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredMatches.length === 0 && (
          <div className="bg-card rounded-2xl p-16 text-center border border-border space-y-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7 text-muted/40" />
            </div>
            <p className="font-bold text-foreground font-outfit text-lg">Aucun match</p>
            <p className="text-muted text-sm">
              {filter === "live"       ? "Aucun match en direct pour le moment."
               : filter === "finished" ? "Aucun match terminé pour le moment."
               : filter === "scheduled"? "Aucun match à venir programmé."
               : "Aucun match disponible."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
