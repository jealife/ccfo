import { createClient } from "@/lib/supabase/server";
import { 
  Calendar, 
  Trophy, 
  Clock, 
  MapPin, 
  ChevronRight,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardMatchesPage() {
  const supabase = await createClient();
  
  // Fetch all matches
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(name, village), away:teams!away_team_id(name, village)')
    .order('match_date', { ascending: true });

  const upcomingMatches = matches?.filter(m => m.status === 'scheduled') || [];
  const pastMatches = matches?.filter(m => m.status === 'finished') || [];

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Calendrier & Matchs</h1>
          <p className="text-muted text-sm italic">Suivez la programmation officielle du tournoi.</p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            placeholder="Rechercher un match..." 
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm focus:border-primary outline-none transition-all w-full md:w-64"
          />
        </div>
      </div>

      {/* UPCOMING MATCHES */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest">Matchs à venir</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingMatches.length > 0 ? upcomingMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          )) : (
            <div className="col-span-full py-12 text-center bg-white/3 rounded-xl border border-dashed border-white/10 text-muted italic text-sm">
              Aucun match programmé pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* PAST MATCHES */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Trophy className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest">Résultats récents</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {pastMatches.length > 0 ? pastMatches.map((match) => (
            <div key={match.id} className="sports-card p-6 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex items-center gap-8 flex-1">
                <div className="text-center min-w-[60px]">
                  <div className="text-xs font-black uppercase text-muted">Final</div>
                </div>
                
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div className="flex-1 flex items-center justify-end gap-4">
                    <span className="font-bold text-sm hidden sm:block">{match.home?.name}</span>
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">{match.home?.name[0]}</div>
                  </div>
                  
                  <div className="px-6 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                    <span className="text-xl font-black font-outfit">{match.home_score}</span>
                    <div className="w-px h-4 bg-white/10" />
                    <span className="text-xl font-black font-outfit">{match.away_score}</span>
                  </div>

                  <div className="flex-1 flex items-center justify-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">{match.away?.name[0]}</div>
                    <span className="font-bold text-sm hidden sm:block">{match.away?.name}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors ml-4" />
            </div>
          )) : (
            <div className="py-12 text-center bg-white/3 rounded-xl border border-dashed border-white/10 text-muted italic text-sm">
              Aucun résultat enregistré.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: any) {
  return (
    <div className="sports-card p-6 space-y-6 group hover:border-primary/30 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
          <Clock className="w-3 h-3 text-primary" />
          {new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
          {match.venue || 'Stade Municipal'}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform">
            {match.home?.name[0]}
          </div>
          <span className="text-xs font-black uppercase tracking-tight text-center">{match.home?.name}</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-2xl font-black font-outfit italic text-white/20">VS</div>
          <div className="text-[10px] font-bold text-primary mt-1">16:00</div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform">
            {match.away?.name[0]}
          </div>
          <span className="text-xs font-black uppercase tracking-tight text-center">{match.away?.name}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-center">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
          <MapPin className="w-3 h-3" />
          {match.home?.village} vs {match.away?.village}
        </div>
      </div>
    </div>
  );
}
