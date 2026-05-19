import { PublicNavbar } from "@/components/public/Navbar";
import { Shield } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { PublicFooter } from "@/components/public/Footer";
import { TeamsFilterClient } from "@/components/public/TeamsFilterClient";

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
              <h1 className="text-3xl md:text-4xl font-black font-outfit uppercase tracking-tighter">Les Équipes <span className="text-primary">2026</span></h1>
              <p className="text-muted text-xs mt-1">Découvrez les clubs qui participent à l'édition CCFO26 de cette année.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold uppercase tracking-widest shrink-0">
              <Shield className="w-4 h-4" /> {teams?.length || 0} Équipes Validées
            </div>
          </div>

          {teams && teams.length > 0 ? (
            <TeamsFilterClient teams={teams} />
          ) : (
            <div className="text-center py-24 space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-10 h-10 text-muted/40" />
              </div>
              <h2 className="text-2xl font-black font-outfit uppercase tracking-tight">Aucune équipe validée</h2>
              <p className="text-muted text-sm">Le processus de validation est en cours. Revenez bientôt.</p>
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}
