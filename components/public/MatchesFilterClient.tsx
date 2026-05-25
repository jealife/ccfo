"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { isGroupPhase } from "@/lib/helpers";
import type { Match } from "@/lib/types";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { MatchTimer } from "./MatchTimer";
import { getTeamPalette } from "@/lib/helpers";

type FilterValue = "Tous" | "live" | "finished" | "scheduled";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "Tous",     value: "Tous"      },
  { label: "Live",     value: "live"      },
  { label: "Terminés", value: "finished"  },
  { label: "À venir",  value: "scheduled" },
];

export function MatchesFilterClient({ initialMatches }: { initialMatches: Match[] }) {
  const [filter, setFilter] = useState<FilterValue>("Tous");

  const filteredMatches = initialMatches.filter((match) =>
    filter === "Tous" || match.status === filter
  );

  const groupedMatches = filteredMatches.reduce<Record<string, Match[]>>((acc, match) => {
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
        {FILTERS.map((f) => (
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

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border shrink-0">
                <Calendar className="w-3 h-3 text-muted" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">{dateStr}</h3>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2.5">
              {groupedMatches[dateStr].map((match) => {
                const isLive     = match.status === "live";
                const isFinished = match.status === "finished";
                const matchDate  = new Date(match.match_date);
                const time       = matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                const startedAt  = (match.stats as Array<{ label: string; value?: string }> | undefined)
                  ?.find((s) => s.label === "started_at")?.value;
                const phaseLabel = match.group_name ?? null;
                const knockout   = phaseLabel && !isGroupPhase(phaseLabel);
                const homeColor  = getTeamPalette(match.home?.name);
                const awayColor  = getTeamPalette(match.away?.name);

                return (
                  <Link href={`/matches/${match.id}`} key={match.id} className="block touch-manipulation group">
                    <div className={cn(
                      "bg-card rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer overflow-hidden",
                      "hover:shadow-md active:scale-[0.99]",
                      isLive ? "border-primary/30 hover:border-primary/50" : "border-border hover:border-primary/20"
                    )}>
                      {isLive && <div className="h-0.5 w-full bg-primary" />}

                      {/* Phase badge */}
                      {phaseLabel && (
                        <div className="px-4 pt-2.5 pb-0 flex items-center gap-1.5">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                            knockout ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"
                          )}>
                            {phaseLabel}
                          </span>
                        </div>
                      )}

                      {/* ── Layout MOBILE premium ── */}
                      <div className="md:hidden">

                        {/* Header : statut + date */}
                        <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
                          {isLive ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                              Live
                            </span>
                          ) : isFinished ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-secondary border border-border text-[9px] font-black text-muted uppercase tracking-widest">
                              Terminé
                            </span>
                          ) : (
                            <span className="text-xs font-black text-accent tabular-nums">{time}</span>
                          )}
                          <span className="text-[10px] font-medium text-muted capitalize">
                            {matchDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                        </div>

                        {/* Corps : 3 colonnes avatar / score / avatar */}
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4">

                          {/* Équipe domicile */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2 transition-transform group-hover:scale-105 duration-200",
                              isLive
                                ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
                                : cn(homeColor.bg, homeColor.border, homeColor.text)
                            )}>
                              {match.home?.name?.[0] ?? "?"}
                            </div>
                            <span className={cn(
                              "text-[11px] font-bold text-center leading-tight line-clamp-2 w-full px-1",
                              isLive ? "text-primary" : "text-foreground"
                            )}>
                              {match.home?.name ?? "—"}
                            </span>
                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Dom.</span>
                          </div>

                          {/* Score central */}
                          <div className="flex flex-col items-center gap-1.5 px-3 min-w-[80px]">
                            <div className={cn(
                              "flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border",
                              isLive
                                ? "bg-primary/10 border-primary/25"
                                : isFinished
                                ? "bg-secondary border-border"
                                : "bg-secondary/60 border-border/60"
                            )}>
                              <span className={cn(
                                "text-2xl font-black tabular-nums font-outfit leading-none",
                                isLive ? "text-primary" : isFinished ? "text-foreground" : "text-muted/50"
                              )}>
                                {match.status === "scheduled" ? "—" : match.home_score ?? 0}
                              </span>
                              <span className="text-muted/30 font-black text-xl leading-none">:</span>
                              <span className={cn(
                                "text-2xl font-black tabular-nums font-outfit leading-none",
                                isLive ? "text-primary" : isFinished ? "text-foreground" : "text-muted/50"
                              )}>
                                {match.status === "scheduled" ? "—" : match.away_score ?? 0}
                              </span>
                            </div>
                            {isLive && (
                              <MatchTimer startedAt={startedAt} status={match.status} />
                            )}
                          </div>

                          {/* Équipe extérieur */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2 transition-transform group-hover:scale-105 duration-200",
                              isLive
                                ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
                                : cn(awayColor.bg, awayColor.border, awayColor.text)
                            )}>
                              {match.away?.name?.[0] ?? "?"}
                            </div>
                            <span className={cn(
                              "text-[11px] font-bold text-center leading-tight line-clamp-2 w-full px-1",
                              isLive ? "text-primary" : "text-foreground"
                            )}>
                              {match.away?.name ?? "—"}
                            </span>
                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Ext.</span>
                          </div>
                        </div>

                        {/* Footer : CTA */}
                        <div className="flex items-center justify-end px-4 pb-3 pt-1 border-t border-border/40">
                          <span className="text-[11px] font-bold text-muted group-hover:text-primary transition-colors flex items-center gap-1">
                            Voir les détails <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* ── Layout DESKTOP ── */}
                      <div className="hidden md:flex items-center gap-0">

                        {/* Status column */}
                        <div className="w-28 flex flex-col items-center justify-center gap-1 shrink-0 py-5 px-4 border-r border-border self-stretch">
                          {isLive ? (
                            <>
                              <span className="flex items-center gap-1 text-xs font-black text-primary uppercase tracking-tight">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                                Live
                              </span>
                              <MatchTimer startedAt={startedAt} status={match.status} />
                            </>
                          ) : isFinished ? (
                            <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-black text-muted uppercase tracking-tight">
                              FIN
                            </span>
                          ) : (
                            <>
                              <span className="text-base font-black text-accent tabular-nums">{time}</span>
                              <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Prévu</span>
                            </>
                          )}
                        </div>

                        {/* Corps du match */}
                        <div className="flex-1 flex items-center gap-5 px-6 py-5 min-w-0">
                          <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                            <span className={cn(
                              "font-bold text-base text-foreground truncate text-right leading-tight",
                              isLive && "text-primary"
                            )}>
                              {match.home?.name ?? "—"}
                            </span>
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-2 shrink-0 transition-transform group-hover:scale-105 duration-200",
                              isLive ? "bg-primary/10 border-primary/30 text-primary" : cn(homeColor.bg, homeColor.border, homeColor.text)
                            )}>
                              {match.home?.name?.[0] ?? "?"}
                            </div>
                          </div>

                          <div className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-xl border shrink-0 min-w-[100px] justify-center",
                            isLive ? "bg-primary/10 border-primary/25" : "bg-secondary border-border"
                          )}>
                            <span className={cn(
                              "text-2xl font-black tabular-nums font-outfit",
                              isLive ? "text-primary" : isFinished ? "text-foreground" : "text-muted/60"
                            )}>
                              {match.status === "scheduled" ? "—" : match.home_score ?? 0}
                            </span>
                            <span className="text-muted/40 font-black text-xl">:</span>
                            <span className={cn(
                              "text-2xl font-black tabular-nums font-outfit",
                              isLive ? "text-primary" : isFinished ? "text-foreground" : "text-muted/60"
                            )}>
                              {match.status === "scheduled" ? "—" : match.away_score ?? 0}
                            </span>
                          </div>

                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-2 shrink-0 transition-transform group-hover:scale-105 duration-200",
                              isLive ? "bg-primary/10 border-primary/30 text-primary" : cn(awayColor.bg, awayColor.border, awayColor.text)
                            )}>
                              {match.away?.name?.[0] ?? "?"}
                            </div>
                            <span className={cn(
                              "font-bold text-base text-foreground truncate leading-tight",
                              isLive && "text-primary"
                            )}>
                              {match.away?.name ?? "—"}
                            </span>
                          </div>
                        </div>

                        <div className="pr-5 pl-1 shrink-0 self-stretch flex items-center">
                          <ChevronRight className="w-5 h-5 text-border group-hover:text-primary transition-colors duration-200" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {filteredMatches.length === 0 && (
          <div className="bg-card rounded-2xl p-16 text-center border border-border space-y-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7 text-muted/40" />
            </div>
            <p className="font-bold text-foreground font-outfit text-lg">Aucun match</p>
            <p className="text-muted text-sm">
              {filter === "live"        ? "Aucun match en direct pour le moment."
               : filter === "finished"  ? "Aucun match terminé pour le moment."
               : filter === "scheduled" ? "Aucun match à venir programmé."
               : "Aucun match disponible."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
