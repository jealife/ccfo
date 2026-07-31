/**
 * seed-team.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Crée un compte manager (auth + profil) et insère une équipe fictive
 * avec ses joueurs, puis lie le tout via manager_id.
 *
 * Usage :
 *   node scripts/seed-team.mjs
 *
 * ⚠️  Requiert SUPABASE_SERVICE_ROLE_KEY pour :
 *     - créer un utilisateur via l'Admin Auth API
 *     - bypasser les policies RLS lors des insertions
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── 1. Charger .env.local ─────────────────────────────────────────────────────
const __dir  = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");

try {
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn("⚠️  .env.local introuvable — variables d'env système utilisées.");
}

// ── 2. Config ─────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY          = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_KEY           = SERVICE_ROLE_KEY || ANON_KEY;

if (!SUPABASE_URL || !API_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL et une clé API sont requis.");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY absente — la création du compte manager peut échouer (RLS).");
}

// ── 3. Helpers HTTP ───────────────────────────────────────────────────────────
const restHeaders = {
  "Content-Type":  "application/json",
  "apikey":        API_KEY,
  "Authorization": `Bearer ${API_KEY}`,
  "Prefer":        "return=representation",
};

async function restPost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: restHeaders,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /${table} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function restPatch(table, filter, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: restHeaders,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PATCH /${table}?${filter} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

// Admin Auth API (nécessite SERVICE_ROLE_KEY)
async function adminCreateUser(email, password, fullName) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        API_KEY,
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,        // email déjà confirmé → connexion directe
      user_metadata: { full_name: fullName },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Admin createUser → ${res.status}: ${text}`);
  return JSON.parse(text);
}

// ── 4. Données fictives ───────────────────────────────────────────────────────

const MANAGER = {
  full_name: "Jean-Baptiste Moussavou",
  email:     "manager.aigles@ccfo-test.com",  // ← email de connexion
  password:  "AiglesOkano2026!",               // ← mot de passe de test
};

const FAKE_TEAM = {
  name:            "Les Aigles d'Okano FC",
  village:         "Fieng Okano",
  jersey_color:    "Rouge & Or",
  status:          "validated",
  president_name:  "Jean-Baptiste Moussavou",
  president_phone: "+241 66 12 34 56",
  whatsapp:        "+241 77 98 76 54",
  email:           "aigles.okano@gmail.com",
};

const FAKE_PLAYERS = [
  { full_name: "Rodrigue Nzamba",       jersey_number:  1, position: "GK",  date_of_birth: "1998-03-15", origin_village: "Fieng Okano"  },
  { full_name: "Patrick Ondo Mba",      jersey_number:  2, position: "DEF", date_of_birth: "2000-07-22", origin_village: "Fieng Okano"  },
  { full_name: "Christian Nguema",      jersey_number:  4, position: "DEF", date_of_birth: "1999-11-05", origin_village: "Okondja"      },
  { full_name: "Franck Bekale",         jersey_number:  5, position: "DEF", date_of_birth: "2001-02-18", origin_village: "Fieng Okano"  },
  { full_name: "Serge Minko",           jersey_number:  6, position: "DEF", date_of_birth: "1997-09-30", origin_village: "Libreville"   },
  { full_name: "Gildas Essono",         jersey_number:  7, position: "MID", date_of_birth: "2002-04-12", origin_village: "Fieng Okano"  },
  { full_name: "Jérémy Obame Ndong",    jersey_number:  8, position: "MID", date_of_birth: "1998-08-08", origin_village: "Mékambo"      },
  { full_name: "Achille Nguema Ondo",   jersey_number: 10, position: "MID", date_of_birth: "2000-01-25", origin_village: "Fieng Okano"  },
  { full_name: "Théodore Mezui",        jersey_number: 11, position: "ATT", date_of_birth: "2001-06-14", origin_village: "Booué"        },
  { full_name: "Emmanuel Mba Obiang",   jersey_number:  9, position: "ATT", date_of_birth: "1999-12-03", origin_village: "Fieng Okano"  },
  { full_name: "Narcisse Owo",          jersey_number: 20, position: "ATT", date_of_birth: "2003-05-19", origin_village: "Fieng Okano"  },
  { full_name: "Aubin Nkoghe",          jersey_number: 16, position: "GK",  date_of_birth: "2004-10-01", origin_village: "Fieng Okano"  },
  { full_name: "Didier Boussougou",     jersey_number: 13, position: "DEF", date_of_birth: "2000-03-27", origin_village: "Lastoursville" },
  { full_name: "Romuald Nze Ndong",     jersey_number: 14, position: "MID", date_of_birth: "2002-07-09", origin_village: "Fieng Okano"  },
  { full_name: "Prince Ondo Ella",      jersey_number: 15, position: "ATT", date_of_birth: "2001-11-22", origin_village: "Fieng Okano"  },
];

// ── 5. Insertion ──────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀  Création du compte manager et de l'équipe fictive…\n");

  // ── Étape 1 : Créer le compte auth du manager ──────────────────────────────
  let managerUser;
  try {
    managerUser = await adminCreateUser(MANAGER.email, MANAGER.password, MANAGER.full_name);
    console.log(`✅  Compte auth créé : ${MANAGER.email} (id: ${managerUser.id})`);
  } catch (err) {
    console.error("❌  Erreur création compte auth :", err.message);
    console.error("    → Vérifiez que SUPABASE_SERVICE_ROLE_KEY est bien définie dans .env.local");
    process.exit(1);
  }

  const managerId = managerUser.id;

  // ── Étape 2 : Créer le profil manager dans public.profiles ────────────────
  // (normalement fait par le trigger handle_new_user, mais on s'assure qu'il existe)
  try {
    await restPost("profiles", {
      id:        managerId,
      full_name: MANAGER.full_name,
      role:      "manager",
    });
    console.log(`✅  Profil manager créé dans public.profiles`);
  } catch (err) {
    // Le trigger l'a peut-être déjà créé → ignorer le conflit
    if (err.message.includes("23505") || err.message.includes("duplicate")) {
      console.log(`ℹ️   Profil déjà créé par le trigger Supabase`);
    } else {
      console.error("❌  Erreur création profil :", err.message);
      process.exit(1);
    }
  }

  // ── Étape 3 : Insérer l'équipe avec manager_id ────────────────────────────
  let teamRows;
  try {
    teamRows = await restPost("teams", { ...FAKE_TEAM, manager_id: managerId });
  } catch (err) {
    console.error("❌  Erreur insertion équipe :", err.message);
    process.exit(1);
  }

  const team = teamRows[0];
  console.log(`✅  Équipe créée : "${team.name}" (id: ${team.id})`);

  // ── Étape 4 : Insérer les joueurs ─────────────────────────────────────────
  let playerRows;
  try {
    playerRows = await restPost("players", FAKE_PLAYERS.map(p => ({ ...p, team_id: team.id })));
  } catch (err) {
    console.error("❌  Erreur insertion joueurs :", err.message);
    process.exit(1);
  }

  console.log(`✅  ${playerRows.length} joueurs insérés :`);
  for (const p of playerRows) {
    console.log(`     #${String(p.jersey_number).padStart(2, "0")} ${p.position.padEnd(3)}  ${p.full_name}`);
  }

  // ── Résumé ─────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("🎉  Seed terminé avec succès !\n");
  console.log("📋  IDENTIFIANTS DE CONNEXION MANAGER");
  console.log("─".repeat(60));
  console.log(`  URL du site  : http://localhost:3000/login`);
  console.log(`  Email        : ${MANAGER.email}`);
  console.log(`  Mot de passe : ${MANAGER.password}`);
  console.log("─".repeat(60));
  console.log(`\n  manager_id   : ${managerId}`);
  console.log(`  team_id      : ${team.id}`);
  console.log("─".repeat(60));
  console.log(`\n🔗  Dashboard Supabase :`);
  console.log(`  ${SUPABASE_URL.replace(".supabase.co", ".supabase.com/project").replace("https://", "https://supabase.com/dashboard/project/")}`);
}

main();
