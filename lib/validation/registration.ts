// ── Schéma partagé client/serveur pour l'inscription d'équipe ──
// Source de vérité unique : le client construit exactement cette forme,
// le serveur la valide avant d'écrire en base.

import { z } from "zod";

/**
 * Date de naissance : champ obligatoire.
 * Attendue au format ISO (AAAA-MM-JJ), tel que produit par <input type="date">
 * et stocké par la colonne `date` de Postgres.
 */
export const dateOfBirthSchema = z
  .string()
  .trim()
  .min(1, "Date de naissance requise")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide (AAAA-MM-JJ)")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return false;
    const year = date.getUTCFullYear();
    return year >= 1900 && date.getTime() <= Date.now();
  }, "Date de naissance invalide");

export const teamInfoSchema = z.object({
  name: z.string().trim().min(2, "Nom d'équipe requis"),
  village: z.string().trim().min(1, "Village requis"),
  jersey_color: z.string().trim().optional().default(""),
  president_name: z.string().trim().min(1, "Nom du président requis"),
  president_phone: z.string().trim().min(6, "Téléphone requis"),
  whatsapp: z.string().trim().optional().default(""),
  email: z.union([z.literal(""), z.string().email("Email invalide")]).optional().default(""),
});

export const staffMemberSchema = z.object({
  full_name: z.string().trim().min(2, "Nom du membre requis"),
  role: z.string().trim().min(1, "Rôle requis"),
  origin_village: z.string().trim().optional().default(""),
  // Le staff a une licence au même titre que les joueurs.
  date_of_birth: z.union([z.literal(""), dateOfBirthSchema]).optional().default(""),
  photo_url: z.union([z.literal(""), z.string().url()]).nullable().optional().default(""),
});

export const playerEntrySchema = z.object({
  full_name: z.string().trim().min(2, "Nom du joueur requis"),
  jersey_number: z.coerce.number().int().min(1, "Numéro invalide").max(99, "Numéro invalide"),
  position: z.string().trim().optional().default(""),
  date_of_birth: dateOfBirthSchema,
  origin_village: z.string().trim().optional().default(""),
});

export const documentsSchema = z.object({
  identity_docs: z.string().url().nullable().optional(),
  village_attestation: z.string().url().nullable().optional(),
  payment_receipt: z.string().url().nullable().optional(),
});

export const registrationSchema = z.object({
  teamInfo: teamInfoSchema,
  staff: z.array(staffMemberSchema),
  players: z.array(playerEntrySchema),
  documents: documentsSchema.optional(),
});

export type RegistrationFormData = z.input<typeof registrationSchema>;
