"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Goal, Square, Award, Star, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getStartedAt, formatFrenchDate, formatMatchStatus } from "@/lib/helpers";
import {
  categorizePosition,
  positionGroupLabel,
  positionGroupBadgeClass,
  POSITION_GROUP_ORDER,
  type PositionGroup,
} from "@/lib/position";
import type { Match, MatchEvent, MatchStat, Player } from "@/lib/types";
import { MatchTimer } from "./MatchTimer";

interface MatchDetailClientProps {
  match: Match;
  events: MatchEvent[];
  stats: MatchStat[];
}

const TABS = [
  { id: "details", label: "Résumé"       },
  // Onglet Statistiques désactivé temporairement — aucune saisie de stats n'est encore possible côté admin.
  { id: "lineups", label: "Compositions" },
] as const;

// "stats" reste dans le type pour que le panneau Statistiques (désactivé ci-dessus) compile toujours.
type TabId = (typeof TABS)[number]["id"] | "stats";

/** Sépare le started_at (stocké dans le JSON stats) des vraies statistiques */
function splitStats(raw: unknown[]): { stats: MatchStat[]; startedAt: string | null } {
  return {
    stats: (raw as MatchStat[]).filter((s) => s.label !== "started_at"),
    startedAt: getStartedAt(raw),
  };
}

export function MatchDetailClient({ match: initialMatch, events: initialEvents, stats: initialStats }: MatchDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [match,  setMatch]        = useState<Match>(initialMatch);
  const [events, setEvents]       = useState<MatchEvent[]>(initialEvents);
  const [stats,  setStats]        = useState<MatchStat[]>(() => splitStats(initialStats ?? []).stats);
  const [startedAt, setStartedAt] = useState<string | null>(() => splitStats(initialStats ?? []).startedAt);

  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}` },
        (payload) => {
          setMatch((prev) => ({ ...prev, ...payload.new }));
          if (payload.new.events) setEvents(payload.new.events as MatchEvent[]);
          if (payload.new.stats) {
            const next = splitStats(payload.new.stats as unknown[]);
            setStats(next.stats);
            if (next.startedAt) setStartedAt(next.startedAt);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [match.id, supabase]);

  const getPlayerInfo = (name: string, teamSide: "home" | "away"): Player | undefined => {
    const players = teamSide === "home" ? match.home?.players : match.away?.players;
    return players?.find((p) =>
      p.full_name === name || name.includes(p.full_name) || p.full_name.includes(name)
    );
  };

  return (
    <div className="w-full">
      {/* ── Onglets ── */}
      <div className="sticky top-16 z-40 bg-card border-b border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex" role="tablist" aria-label="Sections du match">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id ? "true" : "false"}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-5 py-4 text-sm font-bold whitespace-nowrap shrink-0 min-h-[48px]",
                  "touch-manipulation select-none cursor-pointer transition-colors",
                  activeTab === tab.id ? "text-primary" : "text-muted hover:text-foreground"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu des onglets ── */}
      <div className="bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-4 py-8 pb-24 lg:pb-16 max-w-5xl">

          {/* TIMELINE */}
          {activeTab === "details" && (
            <div className="animate-fade-in flex flex-col lg:flex-row gap-6">

              <div className="flex-1 min-w-0">
                <div className="glass-card p-6 md:p-8">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                    Événements du match
                  </h3>

                  {events.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-muted text-sm">Aucun événement enregistré.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6">
                      <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />

                      {events.map((event) => {
                        const playerInfo   = getPlayerInfo(event.player, event.team);
                        const playerInInfo = event.playerIn ? getPlayerInfo(event.playerIn, event.team) : undefined;
                        const isSub        = event.type === "substitution";
                        const teamName     = event.team === "home" ? (match.home?.name ?? "Domicile") : (match.away?.name ?? "Extérieur");
                        const teamInitial  = event.team === "home" ? (match.home?.name?.[0] ?? "?") : (match.away?.name?.[0] ?? "?");

                        return (
                          <div key={event.id} className="relative flex items-start gap-4">
                            <div className={cn(
                              "absolute left-[-29px] w-6 h-6 rounded-full border-2 bg-card flex items-center justify-center z-10 shrink-0",
                              event.type === "goal" ? "border-primary text-primary"
                              : isSub               ? "border-green-500 text-green-500"
                              : event.type === "yellow" ? "border-yellow-500 text-yellow-500"
                              : "border-red-500 text-red-500"
                            )}>
                              {event.type === "goal" ? <Goal className="w-3 h-3" />
                                : isSub ? <ArrowLeftRight className="w-3 h-3" />
                                : <Square className={cn("w-3 h-3 fill-current", event.type === "yellow" ? "text-yellow-500" : "text-red-500")} />
                              }
                            </div>

                            <span className="w-10 text-right shrink-0 text-xs font-black font-outfit text-muted pt-2">
                              {event.minute}&apos;
                            </span>

                            <div className={cn(
                              "flex-1 p-3 md:p-4 rounded-2xl border flex items-center justify-between gap-3",
                              event.type === "goal" ? "bg-primary/5 border-primary/20"
                              : isSub               ? "bg-green-50 border-green-200"
                              : "bg-secondary border-border"
                            )}>
                              {isSub ? (
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-500 text-xs font-black shrink-0">↓</span>
                                    <PlayerAvatar photo={playerInfo?.photo_url} name={event.player} />
                                    <span className="font-bold text-sm text-foreground truncate">{event.player}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-500 text-xs font-black shrink-0">↑</span>
                                    <PlayerAvatar photo={playerInInfo?.photo_url} name={event.playerIn} />
                                    <span className="font-bold text-sm text-foreground truncate">{event.playerIn}</span>
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted">
                                    Changement · {teamName}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 min-w-0">
                                  <PlayerAvatar photo={playerInfo?.photo_url} name={event.player} size="md" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-sm text-foreground truncate block">{event.player}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted">
                                      {event.type === "goal" ? "But" : "Carton"} · {teamName}
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center font-black text-[10px] text-foreground shrink-0">
                                {teamInitial}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:w-72 shrink-0 space-y-4">
                {match.status === "live" && (
                  <MatchTimer startedAt={startedAt ?? undefined} status={match.status} />
                )}

                {match.motm_player && (() => {
                  const motmSide = match.home?.players?.some((p) => p.full_name === match.motm_player) ? "home" : "away";
                  const info = getPlayerInfo(match.motm_player, motmSide);
                  return (
                    <div className="glass-card p-5 border-accent/20 bg-accent/5">
                      <p className="text-accent text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-4">
                        <Award className="w-3 h-3" /> Homme du Match
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-xl bg-secondary border-2 border-accent/30 overflow-hidden flex items-center justify-center relative">
                            {info?.photo_url ? (
                              <Image src={info.photo_url} alt={match.motm_player} fill className="object-cover" sizes="56px" />
                            ) : (
                              <span className="text-2xl font-black text-accent/40">{match.motm_player[0]}</span>
                            )}
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center shadow">
                            <Star className="w-3 h-3 fill-current" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-base font-outfit uppercase tracking-tight text-foreground truncate">
                            {match.motm_player}
                          </p>
                          <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">
                            Performance exceptionnelle
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="glass-card p-5 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Infos match</p>
                  <InfoRow label="Compétition" value="Coupe Cantonale Fieng Okano" />
                  <InfoRow label="Stade"       value={match.venue || "Stade Okano"} />
                  <InfoRow label="Date"        value={formatFrenchDate(match.match_date)} />
                  <InfoRow label="Statut"      value={formatMatchStatus(match.status)} />
                </div>
              </div>
            </div>
          )}

          {/* STATS */}
          {activeTab === "stats" && (
            <div className="animate-fade-in">
              <div className="glass-card p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px]">
                      {match.home?.name?.[0] ?? "?"}
                    </div>
                    <span className="hidden sm:block text-foreground">{match.home?.name ?? "—"}</span>
                  </div>
                  <span className="text-muted">Statistiques</span>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-foreground">{match.away?.name ?? "—"}</span>
                    <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-black text-[10px]">
                      {match.away?.name?.[0] ?? "?"}
                    </div>
                  </div>
                </div>

                {stats.length === 0 ? (
                  <p className="text-center text-muted text-sm py-8">Aucune statistique disponible.</p>
                ) : stats.map((stat, i) => {
                  const homeVal  = typeof stat.home === "string" ? parseFloat(stat.home) : stat.home;
                  const awayVal  = typeof stat.away === "string" ? parseFloat(stat.away) : stat.away;
                  const total    = homeVal + awayVal || 1;
                  const homePerc = (homeVal / total) * 100;

                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-black">
                        <span className={homeVal >= awayVal ? "text-primary" : "text-muted"}>{stat.home}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{stat.label}</span>
                        <span className={awayVal > homeVal ? "text-foreground font-black" : "text-muted"}>{stat.away}</span>
                      </div>
                      <StatBar homePerc={homePerc} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMPOSITIONS */}
          {activeTab === "lineups" && (
            <div className="space-y-4 animate-fade-in">
              <FootballPitch
                homePlayers={match.home?.players ?? []}
                awayPlayers={match.away?.players ?? []}
                homeName={match.home?.name ?? "—"}
                awayName={match.away?.name ?? "—"}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["home", "away"] as const).map((side) => {
                  const team        = match[side];
                  const teamName    = team?.name    ?? "Équipe inconnue";
                  const teamPlayers = team?.players ?? [];
                  const groups      = groupByPosition(teamPlayers);
                  return (
                    <div key={side} className="glass-card overflow-hidden">
                      <div className="bg-secondary border-b border-border p-4 flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full border flex items-center justify-center font-black text-sm",
                          side === "home"
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-card border-border text-foreground"
                        )}>
                          {teamName[0]}
                        </div>
                        <div>
                          <div className="font-black text-sm text-foreground uppercase tracking-tight">{teamName}</div>
                          <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
                            {side === "home" ? "Domicile" : "Extérieur"}
                          </div>
                        </div>
                        <span className="ml-auto text-[10px] font-bold text-muted">{teamPlayers.length} joueurs</span>
                      </div>
                      {teamPlayers.length > 0 ? (
                        <div className="divide-y divide-border">
                          {groups.map(({ group, players }) => (
                            <div key={group}>
                              <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                  positionGroupBadgeClass(group)
                                )}>
                                  {positionGroupLabel(group)}
                                </span>
                                <span className="text-[9px] font-bold text-muted">{players.length}</span>
                              </div>
                              {players.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors">
                                  <span className={cn(
                                    "w-6 text-right font-black font-outfit text-xs shrink-0",
                                    side === "home" ? "text-primary" : "text-foreground"
                                  )}>
                                    {p.jersey_number ?? "—"}
                                  </span>
                                  <PlayerAvatar photo={p.photo_url} name={p.full_name} />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-foreground truncate">{p.full_name}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted text-sm italic">
                          Composition non disponible.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── InfoRow ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted text-xs font-bold shrink-0">{label}</span>
      <span className="font-bold text-foreground text-xs text-right">{value}</span>
    </div>
  );
}

/* ── StatBar — largeur via ref (évite les styles inline JSX) ── */
function StatBar({ homePerc }: { homePerc: number }) {
  const homeRef = useRef<HTMLDivElement>(null);
  const awayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (homeRef.current) homeRef.current.style.width = `${homePerc}%`;
    if (awayRef.current) awayRef.current.style.width = `${100 - homePerc}%`;
  }, [homePerc]);

  return (
    <div className="h-2 flex rounded-full overflow-hidden bg-secondary">
      <div ref={homeRef} className="h-full bg-primary rounded-full transition-all duration-700 ease-out" />
      <div ref={awayRef} className="h-full bg-foreground/20 rounded-full transition-all duration-700 ease-out" />
    </div>
  );
}

/* ── Terrain de foot ── */

type PositionBucket = { group: PositionGroup; players: Player[] };

/** Regroupe par poste sans jamais perdre de joueur (les postes non reconnus vont dans "OTHER"). */
function groupByPosition(players: Player[]): PositionBucket[] {
  const groups: Record<PositionGroup, Player[]> = { GK: [], DEF: [], MID: [], ATT: [], OTHER: [] };
  for (const p of players) groups[categorizePosition(p.position)].push(p);
  return POSITION_GROUP_ORDER.filter((g) => groups[g].length > 0).map((g) => ({ group: g, players: groups[g] }));
}

/** Formation type (ex. "4-3-3"), calculée hors gardien et postes non reconnus. */
function formationLabel(buckets: PositionBucket[]): string | null {
  const counts = new Map(buckets.map((b) => [b.group, b.players.length]));
  const def = counts.get("DEF") ?? 0;
  const mid = counts.get("MID") ?? 0;
  const att = counts.get("ATT") ?? 0;
  if (!def || !mid || !att) return null;
  return `${def}-${mid}-${att}`;
}

function PitchPlayer({ player, color }: { player: Player; color: "red" | "dark" }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0 group/player" title={player.full_name}>
      <div className={cn(
        "relative w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-[11px] text-white shadow-lg overflow-hidden shrink-0",
        "transition-transform duration-200 group-hover/player:scale-110",
        color === "red" ? "bg-primary border-white/80 shadow-primary/30" : "bg-foreground border-white/70 shadow-black/30"
      )}>
        {player.photo_url ? (
          <Image src={player.photo_url} alt="" fill sizes="36px" className="object-cover" />
        ) : (
          player.jersey_number ?? player.full_name?.[0] ?? "?"
        )}
      </div>
      <span className="text-[8px] font-bold text-white max-w-[52px] truncate text-center leading-tight [text-shadow:0_1px_2px_rgb(0_0_0_/_60%)]">
        {player.full_name?.split(" ").pop() ?? ""}
      </span>
    </div>
  );
}

function FootballPitch({ homePlayers, awayPlayers, homeName, awayName }: {
  homePlayers: Player[];
  awayPlayers: Player[];
  homeName: string;
  awayName: string;
}) {
  const homeGroups = groupByPosition(homePlayers);
  const awayGroups = groupByPosition(awayPlayers);
  const homeFormation = formationLabel(homeGroups);
  const awayFormation = formationLabel(awayGroups);

  if (homePlayers.length === 0 && awayPlayers.length === 0) return null;

  return (
    <div className="pitch-bg rounded-3xl overflow-hidden relative">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="5" y="3" width="90" height="94" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="11" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.3)" />
        <rect x="25" y="76" width="50" height="21" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />
        <rect x="35" y="86" width="30" height="11" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />
        <rect x="25" y="3"  width="50" height="21" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />
        <rect x="35" y="3"  width="30" height="11" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />
        <circle cx="50" cy="83" r="0.8" fill="rgba(255,255,255,0.3)" />
        <circle cx="50" cy="17" r="0.8" fill="rgba(255,255,255,0.3)" />
        {[13, 21, 29, 37, 45, 53, 61, 69, 77, 85].map((y) => (
          <rect key={y} x="5" y={y} width="90" height="4" fill="rgba(255,255,255,0.02)" />
        ))}
      </svg>

      <div className="relative z-10 pt-3 pb-1 flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-white/70">{awayName}</span>
        {awayFormation && <span className="text-[8px] font-bold text-white/40 tabular-nums">{awayFormation}</span>}
      </div>
      {/* Le gardien est affiché en premier (extrémité haute = son propre but) */}
      <div className="relative z-10 flex flex-col gap-4 px-4 pb-2">
        {awayGroups.map(({ group, players }) => (
          <div key={group} className="flex justify-center gap-4 flex-wrap">
            {players.map((p) => <PitchPlayer key={p.id} player={p} color="dark" />)}
          </div>
        ))}
      </div>
      <div className="relative z-10 flex items-center justify-center py-1">
        <div className="flex-1 h-px bg-white/20 mx-6" />
        <div className="w-5 h-5 rounded-full border border-white/25 flex items-center justify-center bg-white/5 shrink-0" />
        <div className="flex-1 h-px bg-white/20 mx-6" />
      </div>
      {/* Le gardien est affiché en dernier (extrémité basse = son propre but) */}
      <div className="relative z-10 flex flex-col-reverse gap-4 px-4 pt-2">
        {homeGroups.map(({ group, players }) => (
          <div key={group} className="flex justify-center gap-4 flex-wrap">
            {players.map((p) => <PitchPlayer key={p.id} player={p} color="red" />)}
          </div>
        ))}
      </div>
      <div className="relative z-10 pt-1 pb-3 flex flex-col items-center gap-0.5">
        {homeFormation && <span className="text-[8px] font-bold text-white/40 tabular-nums">{homeFormation}</span>}
        <span className="text-[9px] font-black uppercase tracking-widest text-white/70">{homeName}</span>
      </div>
    </div>
  );
}

/* ── PlayerAvatar ── */
function PlayerAvatar({ photo, name, size = "sm" }: { photo?: string | null; name?: string; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-10 h-10" : "w-7 h-7";
  return (
    <div className={cn(dim, "rounded-full bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center relative")}>
      {photo ? (
        <Image src={photo} alt={name ?? ""} fill className="object-cover" sizes={size === "md" ? "40px" : "28px"} />
      ) : (
        <span className="font-black text-[10px] text-muted">{name?.[0] ?? "?"}</span>
      )}
    </div>
  );
}
