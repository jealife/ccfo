-- ────────────────────────────────────────────────────────────────
-- 1) Nettoyage : colonnes dupliquées sur `players`
--    La table contient à la fois date_of_birth/birth_date et
--    village/origin_village. Le code utilise désormais uniquement
--    date_of_birth et origin_village.
-- ────────────────────────────────────────────────────────────────

-- Récupérer les éventuelles données des colonnes dépréciées
UPDATE public.players SET date_of_birth = birth_date::date
  WHERE date_of_birth IS NULL AND birth_date IS NOT NULL;
UPDATE public.players SET origin_village = village
  WHERE origin_village IS NULL AND village IS NOT NULL;

-- Puis, une fois vérifié que plus rien ne les référence :
-- ALTER TABLE public.players DROP COLUMN IF EXISTS birth_date;
-- ALTER TABLE public.players DROP COLUMN IF EXISTS village;

-- ────────────────────────────────────────────────────────────────
-- 2) Confidentialité Storage : le bucket `team-docs` contient des
--    pièces d'identité et reçus de paiement, et il est actuellement
--    lisible publiquement (vérifié le 10/07/2026).
--
--    Recommandation :
--    a. Passer `team-docs` en privé (Dashboard → Storage → team-docs
--       → Settings → décocher "Public bucket").
--    b. Restreindre la lecture aux admins et au manager propriétaire :
--
-- CREATE POLICY "team-docs admin read"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'team-docs'
--     AND EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );
--
--    c. Adapter ensuite l'affichage côté admin pour utiliser des URLs
--       signées (createSignedUrl) au lieu des URLs publiques stockées.
--       ⚠️ Ne pas passer le bucket en privé AVANT d'avoir fait ce
--       changement de code, sinon les documents déjà uploadés
--       deviendront inaccessibles dans les pages admin.
--
--    Les photos de joueurs (affichées sur le site public) peuvent
--    rester publiques ; idéalement dans le bucket dédié `player-photos`.
-- ────────────────────────────────────────────────────────────────
