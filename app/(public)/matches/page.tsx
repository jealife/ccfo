import { PublicNavbar } from "@/components/public/Navbar";
import { createAdminClient } from "@/lib/supabase/server";
import { MatchesFilterClient } from "@/components/public/MatchesFilterClient";
import { PublicFooter } from "@/components/public/Footer";

export default async function PublicMatchesPage() {
  const supabase = createAdminClient();
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(name), away:teams!away_team_id(name)')
    .order('match_date', { ascending: true });

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30 pt-24 pb-32">
      <PublicNavbar />
      <div className="container mx-auto px-4 pt-8   pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter">Calendrier & Résultats</h1>
            <p className="text-muted text-xs mt-1">L'élite du canton Fieng Okano en direct.</p>
          </div>
          
          <MatchesFilterClient initialMatches={matches || []} />
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}
