-- ────────────────────────────────────────────────────────────────
-- Migration : colonne `registrations_open` sur `tournament_config`
-- À exécuter dans le SQL Editor de Supabase.
--
-- Indépendante de `is_active` (qui reste décoratif / liée à la
-- notion de "tournoi actif") : ce champ contrôle uniquement
-- l'ouverture/fermeture des inscriptions (création de compte manager
-- et soumission de fiche d'équipe).
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.tournament_config
  ADD COLUMN IF NOT EXISTS registrations_open boolean NOT NULL DEFAULT true;
