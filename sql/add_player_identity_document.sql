-- Pièce d'identité individuelle par joueur.
--
-- Jusqu'ici, teams.identity_docs_url regroupait un seul PDF/ZIP pour TOUS les
-- joueurs + le staff d'une équipe. Chaque joueur doit désormais avoir sa
-- propre pièce d'identité, au même titre que sa photo (players.photo_url).
--
-- teams.identity_docs_url reste utilisé, mais uniquement pour les pièces du
-- staff (voir DocumentsStep dans components/forms/RegistrationForm.tsx).
--
-- À exécuter dans Supabase → SQL Editor.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS identity_docs_url text;
