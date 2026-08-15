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

const { data: teams, error } = await supabase
  .from('teams')
  .select('id, name, village, status, manager_id, president_name, president_phone, email, created_at')
  .order('created_at', { ascending: false });

if (error) {
  console.error('ERROR teams:', error.message);
  process.exit(1);
}

console.log(`\n${teams.length} équipe(s) trouvée(s):\n`);

for (const t of teams) {
  let profileInfo = '(pas de profil manager lié)';
  if (t.manager_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, updated_at')
      .eq('id', t.manager_id)
      .maybeSingle();
    profileInfo = profile ? `profil: ${profile.full_name || '(sans nom)'}` : '(profil introuvable)';
  }

  let authEmail = '(non résolu)';
  if (t.manager_id) {
    const { data: authUser } = await supabase.auth.admin.getUserById(t.manager_id);
    authEmail = authUser?.user?.email || '(introuvable)';
  }

  console.log(`- ${t.name} [${t.status}] — ${t.village || '?'}`);
  console.log(`    manager_id: ${t.manager_id}`);
  console.log(`    email de connexion (auth): ${authEmail}`);
  console.log(`    ${profileInfo}`);
  console.log(`    contact équipe: ${t.president_name || '?'} / ${t.president_phone || '?'} / ${t.email || '?'}`);
  console.log('');
}
