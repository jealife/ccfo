-- Acte de naissance individuel par joueur (même logique que
-- sql/add_player_identity_document.sql pour la pièce d'identité).
-- Demandé par les organisateurs, obligatoire au même titre que la pièce
-- d'identité pour la validation d'une équipe (voir docsComplete dans
-- app/(admin)/admin/documents/page.tsx).
--
-- À exécuter dans Supabase → SQL Editor.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS birth_certificate_url text;
