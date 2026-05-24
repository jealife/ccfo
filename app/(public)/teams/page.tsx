import { Shield } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { TeamsFilterClient } from "@/components/public/TeamsFilterClient";

export const revalidate = 300;

export default async function PublicTeamsPage() {
  const supabase = createAdminClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("*, players(count)")
    .eq("status", "validated")
    .order("name", { ascending: true });

  return (
    <main className="bg-background pt-24 pb-24 lg:pb-0">

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-10 lg:pb-16">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black font-outfit uppercase tracking-tighter text-foreground">
                Les Équipes <span className="text-primary">2026</span>
              </h1>
              <p className="text-muted text-sm mt-1">
                Découvrez les clubs qui participent à l'édition CCFO26 de cette année.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold shrink-0">
              <Shield className="w-4 h-4" />
              {teams?.length ?? 0} Équipes validées
            </div>
          </div>

          {/* Content */}
          {teams && teams.length > 0 ? (
            <TeamsFilterClient teams={teams} />
          ) : (
            <div className="bg-card rounded-2xl border border-border p-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-muted/40" />
              </div>
              <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-foreground">
                Aucune équipe validée
              </h2>
              <p className="text-muted text-sm">
                Le processus de validation est en cours. Revenez bientôt.
              </p>
            </div>
          )}
        </div>
      </div>

    </main>
  );
}
