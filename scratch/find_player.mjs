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

const { data: team } = await supabase.from('teams').select('id, name').ilike('name', '%ASM-MATORA%').maybeSingle();
console.log('Équipe:', team);

const { data: player, error } = await supabase
  .from('players')
  .select('id, team_id, full_name, jersey_number, photo_url, identity_docs_url, birth_certificate_url')
  .eq('team_id', team.id)
  .ilike('full_name', '%BIKE NGUEMA%')
  .maybeSingle();

console.log('Joueur:', JSON.stringify(player, null, 2));
if (error) console.error('Erreur:', error.message);
