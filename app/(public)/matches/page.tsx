import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { MatchesFilterClient } from "@/components/public/MatchesFilterClient";
import { Calendar } from "lucide-react";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Calendrier & Résultats",
  description: "Tous les matchs de la Coupe Cantonale Fieng Okano 2026 — résultats, scores en direct et calendrier complet.",
  openGraph: {
    title: "Calendrier & Résultats — CCFO26",
    description: "Consultez les résultats, scores en direct et le calendrier complet de la Coupe Cantonale Fieng Okano 2026.",
    images: [{ url: "/image-1.jpg", width: 1200, height: 630, alt: "CCFO26 Calendrier & Résultats" }],
  },
};

export default async function PublicMatchesPage() {
  const supabase = createAdminClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("*, home:teams!home_team_id(name), away:teams!away_team_id(name)")
    .order("match_date", { ascending: true });

  const liveCount      = (matches ?? []).filter((m) => m.status === "live").length;
  const finishedCount  = (matches ?? []).filter((m) => m.status === "finished").length;
  const scheduledCount = (matches ?? []).filter((m) => m.status === "scheduled").length;

  return (
    <main className="bg-background pt-24 pb-24 lg:pb-0">

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8 pb-0 lg:pb-16">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                <Calendar className="w-3 h-3" />
                Saison 2026
              </div>
              <h1 className="text-3xl md:text-4xl font-black font-outfit uppercase tracking-tighter text-foreground">
                Calendrier & Résultats
              </h1>
              <p className="text-muted text-sm mt-1">
                L’élite du canton Fieng Okano
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {liveCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {liveCount} en direct
                </div>
              )}
              <div className="px-3 py-1.5 rounded-full bg-secondary border border-border text-muted text-xs font-bold">
                {finishedCount} terminés
              </div>
              <div className="px-3 py-1.5 rounded-full bg-secondary border border-border text-muted text-xs font-bold">
                {scheduledCount} à venir
              </div>
            </div>
          </div>

          <MatchesFilterClient initialMatches={matches ?? []} />
        </div>
      </div>
    </main>
  );
}
