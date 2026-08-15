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

const { data: players } = await supabase.from('players').select('id, full_name, photo_url').not('photo_url', 'is', null);
const { data: staff } = await supabase.from('staff').select('id, full_name, photo_url').not('photo_url', 'is', null);

const all = [...(players || []), ...(staff || [])];
const expectedPrefix = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/team-docs/`;
const anomalies = all.filter(x => !x.photo_url.startsWith(expectedPrefix));

console.log(`Total avec photo_url: ${all.length}`);
console.log(`Anomalies (préfixe inattendu): ${anomalies.length}`);
anomalies.forEach(a => console.log(' -', a.full_name, a.photo_url));

// HEAD check on a random sample of 10
const sample = all.sort(() => 0.5 - Math.random()).slice(0, 10);
console.log('\nVérification HTTP sur 10 échantillons aléatoires:');
for (const s of sample) {
  const res = await fetch(s.photo_url, { method: 'HEAD' });
  console.log(`  [${res.status}] ${s.full_name}`);
}
