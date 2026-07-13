# CCFO26 — Plateforme de gestion de tournoi

Plateforme de la **Coupe Cantonale Fieng Okano** : site public pour les supporters (résultats en direct, classement, équipes) et espaces privés pour l'administration et les managers d'équipe.

## 🚀 Fonctionnalités

- **Site public** : accueil, classement par groupe, calendrier/résultats, fiches équipes, live temps réel (Supabase Realtime), SEO (metadata, sitemap, JSON-LD).
- **Inscription multi-étapes** : Équipe → Staff → Joueurs → Documents → Paiement.
- **Dashboard admin** : validation des inscriptions, régie live des matchs (score, événements, homme du match), paiements, documents, suspensions, configuration du tournoi.
- **Dashboard manager** : suivi du dossier, gestion de l'effectif (joueurs, staff, photos).
- **PWA** : installable sur mobile (manifest + prompt d'installation).

## 🛠 Stack

- **Framework** : Next.js 16 (App Router, React 19, React Compiler, convention `proxy.ts`)
- **Styling** : Tailwind CSS 4 · **Icônes** : Lucide React · **Animations** : Framer Motion
- **Validation** : Zod (schémas partagés client/serveur dans `lib/validation/`)
- **Backend** : Supabase (Auth, Postgres + RLS, Storage, Realtime)

## 📦 Démarrage

1. **Installer** :
    ```bash
    npm install
    ```

2. **Configurer Supabase** :
    - Créer un projet sur [Supabase](https://supabase.com).
    - Exécuter le schéma SQL ci-dessous dans le SQL Editor, puis les scripts du dossier [`sql/`](sql/).

3. **Variables d'environnement** :
    ```bash
    cp .env.example .env
    ```
    Renseigner les clés depuis Dashboard → Settings → API.
    ⚠️ `SUPABASE_SERVICE_ROLE_KEY` doit être la clé **service_role** (secrète), pas la clé anon — sans elle, toutes les actions d'écriture (admin et manager) échouent.

4. **Lancer** :
    ```bash
    npm run dev
    ```

## 🗄 Schéma de la base (état réel)

```sql
-- Enums
CREATE TYPE user_role   AS ENUM ('admin', 'manager');
CREATE TYPE team_status AS ENUM ('incomplete', 'pending', 'validated', 'rejected', 'locked');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');

-- Profils (créés par trigger à l'inscription — voir sql/harden_profiles_trigger.sql)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'manager',
  full_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Équipes
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES profiles(id) UNIQUE,
  name TEXT NOT NULL,
  village TEXT,
  jersey_color TEXT,
  president_name TEXT,
  president_phone TEXT,
  phone TEXT,                    -- déprécié, remplacé par president_phone
  whatsapp TEXT,
  email TEXT,
  status team_status DEFAULT 'incomplete',
  identity_docs_url TEXT,        -- sql/add_team_documents.sql
  village_attestation_url TEXT,
  payment_receipt_url TEXT,
  tournament_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Joueurs
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  jersey_number INTEGER,
  date_of_birth DATE,
  position TEXT,
  origin_village TEXT,
  photo_url TEXT,
  id_card_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff technique
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  nationality TEXT,
  role TEXT,
  origin_village TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchs (événements et stats stockés en JSONB ; started_at vit dans stats)
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  match_date TIMESTAMPTZ,
  status match_status DEFAULT 'scheduled',
  group_name TEXT,               -- 'Groupe A' / 'Groupe B' comptent au classement
  venue TEXT,
  is_published BOOLEAN,
  events JSONB,
  stats JSONB,
  lineups JSONB,
  motm_player TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paiements
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  amount DECIMAL(10,2),
  status payment_status DEFAULT 'pending',
  receipt_url TEXT,
  validated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classement (recalculé après chaque match terminé)
CREATE TABLE standings (
  team_id UUID REFERENCES teams(id) PRIMARY KEY,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_diff INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  group_name TEXT
);

-- Configuration du tournoi (ligne unique id=1)
CREATE TABLE tournament_config (
  id INTEGER PRIMARY KEY,
  name TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  max_teams INTEGER,
  players_per_team INTEGER DEFAULT 24,
  staff_per_team INTEGER DEFAULT 6,
  is_active BOOLEAN DEFAULT TRUE,
  points_win INTEGER DEFAULT 3,
  points_draw INTEGER DEFAULT 1,
  points_loss INTEGER DEFAULT 0,
  qualification_spots INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

> Storage : buckets `team-docs` (documents d'équipe — à passer en privé, voir
> `sql/cleanup_and_storage_notes.sql`), `player-photos` et `avatars`.

## 🔐 Sécurité

- RLS activé sur toutes les tables ; les écritures passent par des Server Actions qui vérifient le rôle (`lib/auth.ts`) puis utilisent le client service-role.
- Le rôle des nouveaux comptes est forcé à `manager` côté base (`sql/harden_profiles_trigger.sql`) ; promotion admin uniquement en SQL.
- Les payloads des Server Actions sont validés avec Zod (`lib/validation/`).

## 📱 Design

- **Typo** : Outfit (titres), Inter (texte).
- **Couleurs** : thème sombre/clair, primaire rouge `#CC1F2B` (variables dans `globals.css`).
- **Composants** : classes utilitaires `.sports-card`, `.glass-card`, `.hero-card`.
