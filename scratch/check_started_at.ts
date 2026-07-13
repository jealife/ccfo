import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Create a .env file or set these variables in your shell.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStartedAt() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log("Error selecting from matches:", error.message);
  } else if (data && data.length > 0) {
    console.log("Columns in matches:", Object.keys(data[0]));
  } else {
    console.log("No data in matches table.");
  }
}

checkStartedAt();
