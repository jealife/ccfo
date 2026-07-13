-- ────────────────────────────────────────────────────────────────
-- Migration : colonnes documents sur `teams`
-- À exécuter dans le SQL Editor de Supabase.
--
-- Le code (inscription + pages admin Documents/Paiements) lit et écrit
-- ces colonnes ; sans elles, la soumission d'inscription avec documents
-- échoue et les pages admin n'affichent rien.
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS identity_docs_url       TEXT,
  ADD COLUMN IF NOT EXISTS village_attestation_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_receipt_url     TEXT;
