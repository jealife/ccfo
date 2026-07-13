import { createClient } from './server';

export async function seedDatabase() {
  const supabase = await createClient();

  // 1. Create Teams
  const teams = [
    { name: 'Village FC', village: 'Bassam', jersey_color: 'Bleu', status: 'pending' },
    { name: 'Stars Academy', village: 'Cocody', jersey_color: 'Jaune', status: 'validated' },
    { name: 'Elite Eagles', village: 'Yopougon', jersey_color: 'Blanc', status: 'incomplete' },
    { name: 'Coast United', village: 'Port-Bouët', jersey_color: 'Vert', status: 'rejected' },
  ];

  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .upsert(teams, { onConflict: 'name' })
    .select();

  if (teamError) console.error('Error seeding teams:', teamError);

  // 2. Create Matches
  if (teamData) {
    // group_name doit correspondre à GROUP_PHASES (lib/helpers.ts) pour compter au classement
    const matches = [
      { home_team_id: teamData[0].id, away_team_id: teamData[1].id, status: 'finished', home_score: 2, away_score: 1, group_name: 'Groupe A' },
      { home_team_id: teamData[2].id, away_team_id: teamData[3].id, status: 'scheduled', home_score: 0, away_score: 0, group_name: 'Groupe A' },
    ];

    const { error: matchError } = await supabase
      .from('matches')
      .upsert(matches);

    if (matchError) console.error('Error seeding matches:', matchError);
  }

  console.log('Database seeded successfully!');
}
