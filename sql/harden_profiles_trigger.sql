-- ────────────────────────────────────────────────────────────────
-- Sécurité : le rôle d'un nouveau profil ne doit JAMAIS venir des
-- user_metadata (modifiables par le client). Sinon, n'importe qui
-- peut s'inscrire avec role='admin' via un appel direct à l'API auth.
--
-- Ce script remplace le trigger de création de profil par une version
-- qui force role = 'manager'. La promotion admin se fait uniquement
-- à la main :  UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';
--
-- Vérifiez d'abord le trigger existant :
--   SELECT tgname, pg_get_functiondef(tgfoid)
--   FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'manager'  -- rôle forcé côté serveur, jamais lu depuis les metadata
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Audit : lister les admins existants et vérifier qu'ils sont légitimes
-- SELECT id, full_name, role FROM public.profiles WHERE role = 'admin';
