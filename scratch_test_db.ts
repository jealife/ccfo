import { createClient } from './lib/supabase/server';

async function test() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('tournaments').select('*');
    console.log('Tournaments:', data, error);
    
    const { data: config, error: configError } = await supabase.from('tournament_config').select('*');
    console.log('Config:', config, configError);
}

test();
