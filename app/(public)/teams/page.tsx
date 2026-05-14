import { PublicNavbar } from "@/components/public/Navbar";
import { Users, MapPin, Award, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PublicFooter } from "@/components/public/Footer";

export default async function PublicTeamsPage() {
  const supabase = createAdminClient();
  const { data: teams } = await supabase
    .from('teams')
    .select('*, players(count)')
    .eq('status', 'validated')
    .order('name', { ascending: true });

  return (
    <main className="min-h-screen pt-24 pb-12">
      <PublicNavbar />
      
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">Les Équipes <span className="text-primary">2026</span></h1>
              <p className="text-muted text-xs mt-1">Découvrez les clubs qui participent à l'édition CCFO26 de cette année.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold uppercase tracking-widest">
              <Shield className="w-4 h-4" /> {teams?.length || 0} Équipes Validées
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(teams || []).map((team: any) => (
              <div key={team.id} className="group relative">
                {/* Decoration */}
                <div className="absolute -inset-0.5 bg-linear-to-r from-primary to-accent rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                
                <div className="relative sports-card bg-card/60 backdrop-blur-xl border-white/5 p-5 md:p-8 flex flex-col h-full shadow-2xl">
                  <div className="flex items-start justify-between mb-6 md:mb-8">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-secondary border border-white/10 flex items-center justify-center text-xl md:text-3xl font-black shadow-2xl group-hover:scale-110 transition-transform duration-500">
                      {team.name[0]}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted">Village</div>
                      <div className="font-bold flex items-center justify-end gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-accent" /> {team.village}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black font-outfit uppercase tracking-tight mb-6 group-hover:text-primary transition-colors">
                    {team.name}
                  </h3>

                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted">Effectif</span>
                      </div>
                      <span className="font-black font-outfit text-sm">{team.players?.[0]?.count || 0} Joueurs</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted">Statut</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Confirmé</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!teams || teams.length === 0) && (
            <div className="text-center py-24 space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted">
                <Users className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black font-outfit uppercase">Aucune équipe validée</h2>
              <p className="text-muted">Le processus de validation est en cours.</p>
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}
