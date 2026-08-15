-- Acte de naissance individuel par membre du staff (même logique que
-- sql/add_staff_identity_document.sql pour la pièce d'identité).
--
-- À exécuter dans Supabase → SQL Editor.

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS birth_certificate_url text;
