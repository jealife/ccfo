# CCFO - Tournament Management System (MVP)

This is a complete MVP for managing amateur football tournaments, featuring a public website for fans and a private dashboard for admins and team managers.

## 🚀 Features

- **Public Site**: Home, Standings, Matches, Teams.
- **Multi-step Registration**: Fully digitized process (Team -> Staff -> Players -> Documents -> Payment).
- **Admin Dashboard**: Validate registrations, manage matches, input scores, track standings.
- **Team Manager Dashboard**: Track registration status, manage team roster.
- **Player License**: Automatically generated digital licenses for players.
- **Real-time UI**: Built with Next.js App Router and Tailwind CSS for a premium sports aesthetic.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Database**: Supabase (Auth, DB, Storage)

## 📦 Getting Started

1.  **Clone and Install**:
    ```bash
    npm install
    ```

2.  **Supabase Setup**:
    - Create a new project on [Supabase](https://supabase.com).
    - Run the SQL schema provided below in the Supabase SQL Editor.
    - Copy your API credentials to `.env.local`.

3.  **Run Locally**:
    ```bash
    npm run dev
    ```

## 🗄 Database Schema (SQL)

Run this in your Supabase SQL Editor to initialize the database:

```sql
-- Roles Enum
CREATE TYPE user_role AS ENUM ('admin', 'manager');
CREATE TYPE team_status AS ENUM ('incomplete', 'pending', 'validated', 'rejected', 'locked');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished');
CREATE TYPE event_type AS ENUM ('goal', 'yellow_card', 'red_card', 'mom');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');

-- Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'manager',
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  village TEXT,
  jersey_color TEXT,
  president_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  status team_status DEFAULT 'incomplete',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  jersey_number INTEGER,
  date_of_birth DATE,
  position TEXT,
  village TEXT,
  photo_url TEXT,
  id_card_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT,
  origin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  match_date TIMESTAMP WITH TIME ZONE,
  status match_status DEFAULT 'scheduled',
  group_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Events
CREATE TABLE match_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES teams(id),
  type event_type,
  minute INTEGER,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  status payment_status DEFAULT 'pending',
  receipt_url TEXT,
  validated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standings
CREATE TABLE standings (
  team_id UUID REFERENCES teams(id) PRIMARY KEY,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0
);
```

## 📱 Design Guidelines

- **Typography**: Outfit for headings, Inter for body.
- **Colors**: Dark theme by default. Slate-950 background, Emerald-500 primary accent.
- **Components**: Use the `.sports-card` class for a premium frosted-glass look.
# ccfo
