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

// 1. Bucket-level public/private setting
const { data: bucket, error: bucketError } = await supabase.storage.getBucket('team-docs');
console.log('Bucket team-docs:', JSON.stringify(bucket, null, 2));
if (bucketError) console.error('Erreur bucket:', bucketError.message);

// 2. Sample real players/staff with photos
const { data: players } = await supabase
  .from('players')
  .select('id, full_name, photo_url, identity_docs_url, birth_certificate_url, teams(name)')
  .not('photo_url', 'is', null)
  .limit(5);

console.log(`\n${players?.length || 0} joueur(s) avec photo trouvés:\n`);
for (const p of players || []) {
  console.log(`- ${p.full_name} (${p.teams?.name})`);
  console.log(`  photo: ${p.photo_url}`);
}

const { count: totalPlayers } = await supabase.from('players').select('id', { count: 'exact', head: true });
const { count: withPhoto } = await supabase.from('players').select('id', { count: 'exact', head: true }).not('photo_url', 'is', null);
const { count: totalStaff } = await supabase.from('staff').select('id', { count: 'exact', head: true });
const { count: staffWithPhoto } = await supabase.from('staff').select('id', { count: 'exact', head: true }).not('photo_url', 'is', null);
console.log(`\nJoueurs avec photo: ${withPhoto}/${totalPlayers}`);
console.log(`Staff avec photo: ${staffWithPhoto}/${totalStaff}`);
