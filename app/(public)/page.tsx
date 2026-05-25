import { Trophy, BarChart3, Zap, Award, Activity, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/server";
import { LiveHeroMatch } from "@/components/public/LiveHeroMatch";
import type { Match, Standing, MatchEvent } from "@/lib/types";
import { getTeamPalette } from "@/lib/helpers";

export const revalidate = 30;

export default async function HomePage() {
  const supabase = createAdminClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, status, match_date, home_score, away_score, group_name, events, stats, home:teams!home_team_id(name), away:teams!away_team_id(name)")
    .in("status", ["finished", "live"])
    .order("match_date", { ascending: false })
    .limit(6);

  const { data: nextMatch } = await supabase
    .from("matches")
    .select("id, status, match_date, home_score, away_score, group_name, stats, home_team_id, away_team_id, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)")
    .in("status", ["live", "scheduled"])
    .order("match_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const heroMatch = (nextMatch || matches?.[0]) as unknown as Match | null;

  const { data: standings } = await supabase
    .from("standings")
    .select("*, teams(name)")
    .order("points", { ascending: false })
    .limit(6);

  const { data: config } = await supabase
    .from("tournament_config")
    .select("*")
    .single();

  const tournamentName = config?.name || "Coupe Cantonale Fieng Okano";

  type PlayerRow = { full_name: string; photo_url: string | null; team: { name: string } | null };

  // Top scorers
  const allEvents = (matches || []).flatMap((m) => (m.events as MatchEvent[] | null) ?? []);
  const goalCounts = allEvents
    .filter((e) => e.type === "goal")
    .reduce<Record<string, number>>((acc, g) => {
      acc[g.player] = (acc[g.player] ?? 0) + 1;
      return acc;
    }, {});

  const topScorerNames = Object.entries(goalCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const { data: playerData } = await supabase
    .from("players")
    .select("full_name, photo_url, team:teams(name)")
    .in("full_name", topScorerNames.map(([name]) => name));

  const topScorers = topScorerNames.map(([name, goals], index) => {
    const info = (playerData as PlayerRow[] | null)?.find((p) => p.full_name === name);
    return {
      name,
      goals,
      rank: index + 1,
      team: info?.team?.name ?? "CCFO",
      photo: info?.photo_url ?? null,
    };
  });

  return (
    <main className="bg-background pt-16">

      {/* ── Tournament Marquee Bar ── */}
      <div className="sticky top-16 z-30 bg-card border-b border-border overflow-hidden">
        <div className="flex items-center py-2.5">
          <div className="flex animate-marquee whitespace-nowrap">
            {[0, 1].map((set) => (
              <div key={set} className="flex items-center shrink-0">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="flex items-center gap-2.5 px-8 text-[10px] font-black uppercase tracking-widest text-muted">
                    <Trophy className="w-3 h-3 text-primary shrink-0" />
                    {tournamentName}
                    <span className="text-primary/40">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="container mx-auto px-4 pt-6 pb-24 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Colonne principale ── */}
          <div className="lg:col-span-7 space-y-8">

            {/* Match en direct / à l'affiche */}
            {heroMatch && (
              <section className="space-y-4">
                <SectionHeader
                  title={heroMatch.status === "live" ? "Match en Direct" : "Match à l'Affiche"}
                  icon={<Activity className="w-4 h-4 text-primary" />}
                />
                <LiveHeroMatch initialMatch={heroMatch} />
              </section>
            )}

            {/* Derniers résultats */}
            <section className="space-y-4">
              <SectionHeader
                title="Derniers Résultats"
                icon={<Zap className="w-4 h-4 text-primary" />}
                href="/matches"
              />
              <div className="space-y-3">
                {(matches || []).length > 0 ? (matches as unknown as Match[]).map((match) => (
                  <MatchRowCard key={match.id} match={match} />
                )) : (
                  <div className="glass-card p-8 text-center">
                    <p className="text-muted text-sm">Aucun résultat disponible pour le moment.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-5 space-y-8">

            {/* Classement compact */}
            <section className="space-y-4">
              <SectionHeader
                title="Classement"
                icon={<BarChart3 className="w-4 h-4 text-primary" />}
                href="/standings"
              />
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary border-b border-border">
                      <th title="Position" className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted w-10 cursor-help">#</th>
                      <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted">Club</th>
                      <th title="Matchs Joués" className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted cursor-help">MJ</th>
                      <th title="Différence de buts (marqués − encaissés)" className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted cursor-help">+/-</th>
                      <th title="Points" className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted cursor-help">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(standings || []).length > 0 ? (standings as Standing[]).map((row, i) => (
                      <tr key={row.team_id} className="hover:bg-secondary/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black mx-auto",
                            i < 3 ? "bg-primary text-white" : "bg-secondary text-muted"
                          )}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-black text-foreground shrink-0">
                              {row.teams?.name?.[0]}
                            </div>
                            <span className="font-bold text-sm text-foreground truncate">{row.teams?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-muted font-medium">{row.played ?? 0}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold">
                          <span className={cn(
                            (row.goal_diff ?? 0) > 0 ? "text-green-500"
                              : (row.goal_diff ?? 0) < 0 ? "text-red-500"
                              : "text-muted"
                          )}>
                            {(row.goal_diff ?? 0) > 0 ? `+${row.goal_diff}` : (row.goal_diff ?? 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-black text-primary">{row.points}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">
                          Aucune donnée disponible.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </section>

            {/* Top buteurs */}
            {topScorers.length > 0 && (
              <section className="space-y-4">
                <SectionHeader
                  title="Meilleurs Buteurs"
                  icon={<Award className="w-4 h-4 text-primary" />}
                />
                <div className="space-y-3">
                  {topScorers.map((player, i) => (
                    <div
                      key={i}
                      className="glass-card p-4 flex items-center gap-4 hover:border-primary/20 transition-all duration-200"
                    >
                      {/* Rank */}
                      <span className="text-xl font-black text-primary/25 w-5 text-center shrink-0 font-outfit">
                        {player.rank}
                      </span>

                      {/* Avatar */}
                      <div className="relative w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {player.photo ? (
                          <Image src={player.photo} alt={player.name} fill sizes="40px" className="object-cover" />
                        ) : (
                          <span className="font-black text-sm text-foreground">{player.name[0]}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-foreground truncate">{player.name}</div>
                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{player.team}</div>
                      </div>

                      {/* Goals */}
                      <div className="text-right shrink-0">
                        <div className="text-xl font-black text-foreground font-outfit">{player.goals}</div>
                        <div className="text-[8px] font-bold uppercase tracking-widest text-muted">Buts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

        </div>
      </div>

    </main>
  );
}

/* ── Composants locaux ── */

function SectionHeader({
  title, icon, href,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-black text-foreground flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          Voir tout <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function MatchRowCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const matchDate = new Date(match.match_date);
  const homeColor = getTeamPalette(match.home?.name);
  const awayColor = getTeamPalette(match.away?.name);

  return (
    <Link href={`/matches/${match.id}`} className="block touch-manipulation">
      <div className={cn(
        "bg-card rounded-2xl p-4 flex items-center gap-3 border transition-all duration-200 cursor-pointer",
        "hover:shadow-md active:scale-[0.98]",
        isLive
          ? "border-primary/25 bg-primary/3 hover:border-primary/40"
          : "border-border hover:border-primary/20",
        "shadow-sm"
      )}>

        {/* Home team — logo + name (reversed for right-align) */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse justify-start">
          <span className="font-bold text-xs md:text-sm text-foreground truncate text-right">
            {match.home?.name}
          </span>
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border shrink-0",
            isLive
              ? "bg-primary/10 border-primary/30 text-primary"
              : cn(homeColor.bg, homeColor.border, homeColor.text)
          )}>
            {match.home?.name?.[0]}
          </div>
        </div>

        {/* Score / Time */}
        <div className="flex flex-col items-center justify-center min-w-[76px] shrink-0">
          {match.status === "scheduled" ? (
            <>
              <span className="text-sm font-black text-accent">
                {matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-[9px] font-bold text-muted uppercase tracking-wide">
                {matchDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </span>
            </>
          ) : (
            <>
              <span className={cn(
                "text-base font-black tracking-tight tabular-nums",
                isLive ? "text-primary" : "text-foreground"
              )}>
                {match.home_score} : {match.away_score}
              </span>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wide",
                isLive ? "text-primary animate-pulse" : "text-muted"
              )}>
                {isLive ? "LIVE" : "FIN"}
              </span>
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border shrink-0",
            isLive
              ? "bg-primary/10 border-primary/30 text-primary"
              : cn(awayColor.bg, awayColor.border, awayColor.text)
          )}>
            {match.away?.name?.[0]}
          </div>
          <span className="font-bold text-xs md:text-sm text-foreground truncate">
            {match.away?.name}
          </span>
        </div>

      </div>
    </Link>
  );
}
