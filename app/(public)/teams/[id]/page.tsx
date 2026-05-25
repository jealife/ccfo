import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/server";
import { ChevronLeft, MapPin, Users, ShieldCheck, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/types";

export const revalidate = 300;

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: team } = await supabase
    .from("teams")
    .select("name, village")
    .eq("id", id)
    .eq("status", "validated")
    .single();

  if (!team) return { title: "Équipe introuvable" };

  const location = team.village ? ` de ${team.village}` : "";
  const title = team.name;
  const description = `Découvrez l'effectif de ${team.name}${location} — joueurs, numéros de maillot et positions. Coupe Cantonale Fieng Okano 2026.`;

  return {
    title,
    description,
    openGraph: {
      title: `${team.name} | CCFO26`,
      description,
      images: [{ url: "/image-1.jpg", width: 1200, height: 630, alt: team.name }],
    },
  };
}

const POSITION_LABELS: Record<string, string> = {
  GK:  "Gardien",
  DEF: "Défenseur",
  MID: "Milieu",
  ATT: "Attaquant",
  FWD: "Attaquant",
};

const POSITION_COLORS: Record<string, string> = {
  GK:  "bg-yellow-400/15 text-yellow-500 border-yellow-400/20",
  DEF: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  MID: "bg-green-500/15 text-green-400 border-green-500/20",
  ATT: "bg-primary/15 text-primary border-primary/20",
  FWD: "bg-primary/15 text-primary border-primary/20",
};

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: team }, { data: players }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, village, jersey_color, status")
      .eq("id", id)
      .eq("status", "validated")
      .single(),
    supabase
      .from("players")
      .select("id, full_name, position, jersey_number, photo_url")
      .eq("team_id", id)
      .order("jersey_number", { ascending: true }),
  ]);

  if (!team) notFound();

  const typedPlayers = (players ?? []) as Player[];

  const byPosition: Record<string, Player[]> = {};
  for (const p of typedPlayers) {
    const pos = p.position ?? "—";
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(p);
  }

  const positionOrder = ["GK", "DEF", "MID", "ATT", "FWD"];
  const sortedPositions = [
    ...positionOrder.filter((pos) => byPosition[pos]),
    ...Object.keys(byPosition).filter((pos) => !positionOrder.includes(pos)),
  ];

  return (
    <main className="bg-background pt-24 pb-24 lg:pb-0">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8 lg:pb-16">

          {/* Back */}
          <Link
            href="/teams"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Toutes les équipes
          </Link>

          {/* Hero équipe */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-4xl font-black text-primary shrink-0">
              {team.name[0]}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black font-outfit uppercase tracking-tighter text-foreground">
                {team.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                {team.village && (
                  <div className="flex items-center gap-1.5 text-sm text-muted font-medium">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    {team.village}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted font-medium">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  {typedPlayers.length} joueur{typedPlayers.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-500">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  Confirmé
                </div>
              </div>
            </div>
          </div>

          {/* Effectif */}
          {typedPlayers.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <Users className="w-7 h-7 text-muted/40" />
              </div>
              <p className="font-bold text-foreground">Effectif non publié</p>
              <p className="text-muted text-sm">La liste des joueurs sera disponible prochainement.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedPositions.map((pos) => (
                <div key={pos} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                      POSITION_COLORS[pos] ?? "bg-secondary text-muted border-border"
                    )}>
                      {POSITION_LABELS[pos] ?? pos}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {byPosition[pos].map((player) => (
                      <PlayerCard key={player.id} player={player} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden group hover:border-primary/25 hover:shadow-md transition-all duration-200">
      {/* Photo */}
      <div className="relative w-full aspect-square bg-secondary">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.full_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-black text-muted/30">
              {player.full_name[0]}
            </span>
          </div>
        )}
        {/* Numéro de maillot */}
        {player.jersey_number != null && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-black text-white tabular-nums">
              {player.jersey_number}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-sm text-foreground leading-tight truncate">
          {player.full_name}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <Shirt className="w-3 h-3 text-muted shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
            {POSITION_LABELS[player.position ?? ""] ?? player.position ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
