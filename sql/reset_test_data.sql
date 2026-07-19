-- ==============================================================================
-- SCRIPT DE RÉINITIALISATION DES DONNÉES DE TEST
-- ==============================================================================
-- Ce script supprime toutes les données de test (équipes, matchs, joueurs, etc.)
-- pour préparer la base de données à recevoir les vraies inscriptions.
--
-- ⚠️ ATTENTION : À exécuter uniquement dans le SQL Editor de Supabase.
-- Cette action est irréversible.
-- ==============================================================================

-- 1. Vider toutes les tables transactionnelles
-- Le mot-clé CASCADE force la suppression même s'il y a des clés étrangères.
TRUNCATE TABLE 
    public.match_events, 
    public.matches, 
    public.payments, 
    public.players, 
    public.staff, 
    public.teams 
CASCADE;

-- 2. (Optionnel) Supprimer tous les comptes "manager" de test.
-- Cela supprime les utilisateurs de l'authentification et de la table profiles.
-- L'administrateur (role = 'admin') ne sera PAS supprimé.
DELETE FROM auth.users 
WHERE id IN (
    SELECT id 
    FROM public.profiles 
    WHERE role = 'manager'
);

-- ==============================================================================
-- Note : La configuration du tournoi (table `tournament_config`) n'est pas 
-- supprimée par ce script car elle contient les paramètres (dates, points, etc.)
-- nécessaires au fonctionnement du site.
-- ==============================================================================
