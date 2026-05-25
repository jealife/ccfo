import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";

const BASE = "https://ccfo.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const [{ data: matches }, { data: teams }] = await Promise.all([
    supabase.from("matches").select("id, match_date, status").order("match_date", { ascending: false }),
    supabase.from("teams").select("id").eq("status", "validated"),
  ]);

  const matchEntries: MetadataRoute.Sitemap = (matches ?? []).map((m) => ({
    url: `${BASE}/matches/${m.id}`,
    lastModified: new Date(m.match_date),
    changeFrequency: m.status === "finished" ? "monthly" : "hourly",
    priority: m.status === "live" ? 1.0 : m.status === "finished" ? 0.7 : 0.8,
  }));

  const teamEntries: MetadataRoute.Sitemap = (teams ?? []).map((t) => ({
    url: `${BASE}/teams/${t.id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    { url: BASE,                   changeFrequency: "hourly",  priority: 1.0 },
    { url: `${BASE}/matches`,      changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/standings`,    changeFrequency: "hourly",  priority: 0.85 },
    { url: `${BASE}/teams`,        changeFrequency: "weekly",  priority: 0.7 },
    ...matchEntries,
    ...teamEntries,
  ];
}
