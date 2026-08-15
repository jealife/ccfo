import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PLAYER_ID = 'd61ad31b-6e8a-4f90-bd3e-0de9c9527038';

const { data: player } = await supabase
  .from('players')
  .select('photo_url, identity_docs_url, birth_certificate_url')
  .eq('id', PLAYER_ID)
  .single();

const toPath = (url) => url ? url.split('/public/team-docs/')[1] : null;
const paths = [player.photo_url, player.identity_docs_url, player.birth_certificate_url]
  .map(toPath)
  .filter(Boolean);

if (paths.length > 0) {
  const { data: removed, error: storageError } = await supabase.storage.from('team-docs').remove(paths);
  console.log('Fichiers supprimés du storage:', removed?.map(f => f.name));
  if (storageError) console.error('Erreur storage:', storageError.message);
} else {
  console.log('Aucun fichier à supprimer.');
}

const { data, error } = await supabase
  .from('players')
  .update({ photo_url: null, identity_docs_url: null, birth_certificate_url: null })
  .eq('id', PLAYER_ID)
  .select('id, full_name, photo_url, identity_docs_url, birth_certificate_url')
  .single();

if (error) {
  console.error('Erreur update:', error.message);
} else {
  console.log('Joueur nettoyé:', JSON.stringify(data, null, 2));
}
