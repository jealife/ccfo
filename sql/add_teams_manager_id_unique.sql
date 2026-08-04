-- Contrainte d'unicité manquante sur teams.manager_id.
--
-- app/api/registration/actions.ts fait .upsert([...], { onConflict: 'manager_id' })
-- dans submitTeamRegistration ET saveRegistrationDraft (l'auto-save). Sans contrainte
-- unique (ou index unique) sur cette colonne, Postgres/PostgREST rejette CHAQUE upsert
-- avec l'erreur :
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- ce qui signifie que l'inscription (brouillon ET soumission finale) peut échouer
-- silencieusement selon l'endroit où l'erreur est (ou n'est pas) remontée.
--
-- À exécuter dans Supabase → SQL Editor.

-- 1. Dédoublonner l'existant : on conserve l'équipe la plus ancienne par manager
--    (au cas où des doublons manager_id existent déjà en l'absence de contrainte).
DELETE FROM public.teams t
USING public.teams older
WHERE t.manager_id = older.manager_id
  AND t.manager_id IS NOT NULL
  AND older.created_at < t.created_at;

-- 2. Contrainte d'unicité (les lignes avec manager_id NULL, s'il y en a, restent
--    autorisées : NULL n'est jamais considéré égal à NULL par UNIQUE en Postgres).
ALTER TABLE public.teams
  ADD CONSTRAINT teams_manager_id_key UNIQUE (manager_id);
