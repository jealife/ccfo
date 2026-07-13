"use server";

import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTournamentConfig() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tournament_config')
    .select('*')
    .single();

  if (error) {
    console.error("Error fetching tournament config:", error);
    return null;
  }

  return data;
}

const configSchema = z.object({
  name: z.string().trim().min(1).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  registration_deadline: z.string().optional(),
  max_teams: z.number().int().min(2).optional(),
  players_per_team: z.number().int().min(1).max(40).optional(),
  staff_per_team: z.number().int().min(0).max(20).optional(),
  is_active: z.boolean().optional(),
  points_win: z.number().int().min(0).optional(),
  points_draw: z.number().int().min(0).optional(),
  points_loss: z.number().int().min(0).optional(),
  qualification_spots: z.number().int().min(0).optional(),
});

export async function updateTournamentConfig(configData: z.infer<typeof configSchema>) {
  const { error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const parsed = configSchema.safeParse(configData);
  if (!parsed.success) {
    return { success: false, error: "Configuration invalide : " + parsed.error.issues.map(i => i.message).join(', ') };
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('tournament_config')
    .upsert({
      id: 1,
      ...parsed.data,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Error updating tournament config:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tournaments');
  revalidatePath('/standings');
  revalidatePath('/');

  return { success: true };
}
