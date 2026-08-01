-- ⚠️ À EXÉCUTER AVANT DE DÉPLOYER (Supabase → SQL Editor).
-- Sans ces colonnes, la licence staff, les photos du staff et le
-- verrouillage de l'effectif ne fonctionnent pas.

-- 1. Le staff a désormais une licence comme les joueurs : il lui faut donc
--    une photo et une date de naissance.
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS photo_url     text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- 2. `origin` est l'ancienne colonne, `origin_village` la nouvelle (cf.
--    sql/cleanup_and_storage_notes.sql). On rapatrie ce qui traîne encore
--    dans `origin` avant que l'application n'utilise plus que origin_village.
UPDATE public.staff
   SET origin_village = origin
 WHERE origin_village IS NULL
   AND origin IS NOT NULL;

-- 3. Verrouillage de l'effectif après validation.
--    Une équipe validée est figée : le manager ne peut plus ajouter ni
--    retirer de joueurs/staff. L'admin peut rouvrir ponctuellement l'accès
--    en passant ce drapeau à true, sans dévalider l'équipe (ce qui
--    annulerait son reçu et fausserait le classement).
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS registration_unlocked boolean NOT NULL DEFAULT false;
