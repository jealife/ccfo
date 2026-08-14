-- À exécuter dans Supabase Dashboard > SQL Editor
-- Ajoute la valeur 'half_time' à l'enum match_status (mi-temps de la régie live)
--
-- IMPORTANT : ALTER TYPE ... ADD VALUE ne peut pas s'exécuter dans le même bloc de
-- transaction qu'une requête qui utilise ensuite cette valeur. Exécuter cette
-- instruction seule (le SQL Editor de Supabase l'exécute déjà hors transaction explicite).

ALTER TYPE match_status ADD VALUE IF NOT EXISTS 'half_time';
