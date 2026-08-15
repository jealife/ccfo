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

const REDIRECT_TO = process.argv[2] || 'https://www.coupecantonalefiengokano.ga/';

const { data: teams } = await supabase
  .from('teams')
  .select('name, manager_id')
  .order('name');

console.log(`\nLiens magiques (redirect: ${REDIRECT_TO})\n`);

for (const t of teams) {
  if (!t.manager_id) continue;
  const { data: authUser } = await supabase.auth.admin.getUserById(t.manager_id);
  const email = authUser?.user?.email;
  if (!email) continue;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: REDIRECT_TO },
  });

  if (error) {
    console.log(`- ${t.name} (${email}): ERREUR — ${error.message}`);
    continue;
  }
  console.log(`- ${t.name} (${email}):\n  ${data.properties.action_link}\n`);
}
