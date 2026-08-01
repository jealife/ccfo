-- Un seul paiement de frais d'affiliation par équipe.
--
-- Le code applicatif (app/api/teams/actions.ts) ne dépend PAS de cette
-- contrainte : il fait un select-puis-update/insert. Cette migration est un
-- garde-fou en base contre les doublons créés à la main ou par un import.
--
-- À exécuter dans Supabase → SQL Editor.

-- 1. Dédoublonner l'existant : on conserve le paiement le plus ancien par équipe.
DELETE FROM public.payments p
USING public.payments older
WHERE p.team_id = older.team_id
  AND older.created_at < p.created_at;

-- 2. Contrainte d'unicité.
ALTER TABLE public.payments
  ADD CONSTRAINT payments_team_id_key UNIQUE (team_id);

-- 3. Rattrapage : les équipes validées AVANT la mise en place de cette
--    mécanique n'ont pas de ligne `payments`, donc pas de reçu à afficher
--    dans /dashboard/receipt. On leur en crée une.
--    (Alternative sans SQL : re-valider l'équipe depuis l'admin, ce qui
--    déclenche désormais l'écriture du paiement.)
INSERT INTO public.payments (team_id, amount, status, receipt_url, created_at)
SELECT t.id, 400000, 'paid', t.payment_receipt_url, now()
FROM public.teams t
WHERE t.status = 'validated'
  AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.team_id = t.id);
