import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dmsnfrzqbmzgkwfyittc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc25mcnpxYm16Z2t3ZnlpdHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDgwNjYsImV4cCI6MjA5MzQyNDA2Nn0.fq0g2yLqFl_kOb0Sv4y23WwXU2dAJP1hLTML0wiYvaM";
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
