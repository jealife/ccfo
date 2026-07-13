import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Create a .env file or set these variables in your shell.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addStartedAtColumn() {
  // Supabase JS client doesn't support ALTER TABLE directly.
  // We have to use the RPC if it exists or use the SQL API if available.
  // This script now reads credentials from environment variables, not from source.
  console.log("Ready to run schema maintenance with secure environment variables.");
}

addStartedAtColumn();
