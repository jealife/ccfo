"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Loader2, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { MatchEvent } from "@/lib/types";

type MatchRow = {
  events: MatchEvent[] | null;
  home: { name: string } | null;
  away: { name: string } | null;
};

type PlayerSuspension = {
  name: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  suspended: boolean;
  reason: string;
};

export default function AdminSuspensionsPage() {
  const [suspensions, setSuspensions] = useState<PlayerSuspension[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  async function computeSuspensions() {
    // Fetch all finished match events + team names
    const { data: matches } = await supabase
      .from('matches')
      .select('events, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .eq('status', 'finished');

    if (!matches) { setLoading(false); return; }
    const typedMatches = matches as unknown as MatchRow[];

    // Accumulate yellow/red card counts per player name + team
    const cardMap: Record<string, { name: string; teamName: string; yellows: number; reds: number }> = {};

    for (const match of typedMatches) {
      const events = match.events ?? [];
      for (const evt of events) {
        if (evt.type !== 'yellow' && evt.type !== 'red') continue;
        const teamName = evt.team === 'home' ? match.home?.name : match.away?.name;
        const key = `${evt.player}__${teamName}`;
        if (!cardMap[key]) cardMap[key] = { name: evt.player, teamName: teamName || '—', yellows: 0, reds: 0 };
        if (evt.type === 'yellow') cardMap[key].yellows++;
        if (evt.type === 'red') cardMap[key].reds++;
      }
    }

    // Determine suspensions: 2+ yellows → suspended, 1+ red → suspended
    const result: PlayerSuspension[] = Object.values(cardMap).map(p => {
      const suspended = p.yellows >= 2 || p.reds >= 1;
      const reasons: string[] = [];
      if (p.reds >= 1) reasons.push(`${p.reds} carton${p.reds > 1 ? 's' : ''} rouge`);
      if (p.yellows >= 2) reasons.push(`${p.yellows} cartons jaunes`);
      return {
        name: p.name,
        teamName: p.teamName,
        yellowCards: p.yellows,
        redCards: p.reds,
        suspended,
        reason: reasons.join(' + ') || '—',
      };
    }).sort((a, b) => {
      // Suspended first, then by card count
      if (a.suspended !== b.suspended) return a.suspended ? -1 : 1;
      return (b.redCards * 10 + b.yellowCards) - (a.redCards * 10 + a.yellowCards);
    });

    setSuspensions(result);
    setLoading(false);
  }

  useEffect(() => {
    const kickoff = setTimeout(computeSuspensions, 0);
    return () => clearTimeout(kickoff);
    // chargement initial uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = suspensions.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.teamName.toLowerCase().includes(search.toLowerCase())
  );

  const suspendedCount = suspensions.filter(s => s.suspended).length;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" /> Suspensions
          </h1>
          <p className="text-muted text-sm mt-1">Joueurs suspendus suite à accumulation de cartons.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un joueur ou une équipe..."
            className="w-full md:w-80 bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Suspendus", value: suspendedCount, color: "text-red-500 bg-red-500/10" },
          { label: "Cartons Rouges", value: suspensions.filter(s => s.redCards > 0).length, color: "text-red-400 bg-red-500/10" },
          { label: "2+ Cartons Jaunes", value: suspensions.filter(s => s.yellowCards >= 2).length, color: "text-yellow-500 bg-yellow-500/10" },
          { label: "Joueurs suivis", value: suspensions.length, color: "text-muted bg-white/5" },
        ].map(s => (
          <div key={s.label} className="sports-card p-5 bg-card/30 border-white/5 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg", s.color)}>{s.value}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Suspension rules info */}
      <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-white/3 border border-white/5 text-xs text-muted font-bold">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[9px] text-red-400">R</span> 1 rouge = suspendu 1 match</span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-[9px] text-yellow-400">J</span> 2 jaunes cumulés = suspendu 1 match</span>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center sports-card space-y-3">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500/30" />
          <p className="text-muted italic">Aucun joueur suivi ou suspendu.</p>
        </div>
      ) : (
        <div className="sports-card bg-card/30 border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted">Joueur</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted">Équipe</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted text-center">
                    <span className="text-yellow-500">Jaunes</span>
                  </th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted text-center">
                    <span className="text-red-500">Rouges</span>
                  </th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s, i) => (
                  <tr key={i} className={cn("transition-colors", s.suspended ? "bg-red-500/5 hover:bg-red-500/8" : "hover:bg-white/3")}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs text-muted">
                          {s.name[0]}
                        </div>
                        <span className="font-bold text-sm">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted font-bold uppercase tracking-tight">{s.teamName}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm",
                        s.yellowCards >= 2 ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-muted"
                      )}>
                        {s.yellowCards}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm",
                        s.redCards >= 1 ? "bg-red-500/20 text-red-400" : "bg-white/5 text-muted"
                      )}>
                        {s.redCards}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {s.suspended ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-[9px] font-black uppercase tracking-widest w-fit">
                            <AlertTriangle className="w-3 h-3" /> Suspendu
                          </span>
                          <span className="text-[9px] text-red-400/60 font-bold">{s.reason}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-muted text-[9px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3 text-green-500/50" /> Qualifié
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
