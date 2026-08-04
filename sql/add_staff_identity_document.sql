-- Pièce d'identité individuelle par membre du staff (même logique que
-- sql/add_player_identity_document.sql pour les joueurs).
--
-- teams.identity_docs_url et teams.village_attestation_url ne sont plus
-- écrits par le formulaire d'inscription (voir RegistrationForm.tsx) :
-- - l'identité est désormais individuelle (players.identity_docs_url,
--   staff.identity_docs_url) ;
-- - le certificat de village a été retiré du parcours d'inscription.
-- Ces deux colonnes restent en base (pour ne pas casser les équipes déjà
-- validées) mais ne sont plus alimentées.
--
-- À exécuter dans Supabase → SQL Editor.

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS identity_docs_url text;
