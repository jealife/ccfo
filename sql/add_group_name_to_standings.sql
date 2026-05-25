-- À exécuter dans Supabase Dashboard > SQL Editor
-- Ajoute la colonne group_name à la table standings

ALTER TABLE standings ADD COLUMN IF NOT EXISTS group_name TEXT;

CREATE INDEX IF NOT EXISTS idx_standings_group_name ON standings(group_name);
