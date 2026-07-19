# 📋 Audit Complet — CCFO Platform
*Dernière mise à jour : 19/07/2026 — centralisation des constantes, placeholder Mobile Money, .env.example*

---

## 🔍 Contexte
Audit complet mené le 10/07/2026 (code + base de données réelle via les clés du `.env`), suivi d'une passe de correction intégrale le 11/07/2026 : `next build` ✓, `tsc --noEmit` ✓, `eslint` 0 erreur / 0 warning.
Audit de déploiement le 19/07/2026 : 5 corrections de code supplémentaires (constantes, URL, Mobile Money).

---

## ✅ Corrigé dans le code (11/07/2026)

### Bloquants
1. **Build cassé** — `createAdminClient` non importé dans `app/api/tournaments/actions.ts` → corrigé (guards factorisés dans `lib/auth.ts`).
2. **« Ajouter un joueur » cassé** — le placeholder « Nouveau Joueur » était rejeté par le serveur → remplacé par un **brouillon local** : le joueur n'est créé côté serveur qu'à la sauvegarde d'un vrai nom.
3. **Inscription : perte de données silencieuse** — désalignement complet client/serveur (staff et joueurs filtrés à 100 %, couleur/président/téléphone ignorés, documents jamais transmis, rechargement sur les mauvaises colonnes) → **schéma Zod partagé** (`lib/validation/registration.ts`), mapping explicite, mise à jour des joueurs **par nom sans perdre les photos**, erreurs serveur affichées à l'utilisateur.

### Sécurité
4. **Statut d'équipe forcé côté serveur** — un manager ne peut plus soumettre `status: 'validated'` ; une équipe validée/verrouillée ne peut plus être modifiée par son manager.
5. **Validation Zod sur toutes les Server Actions** — joueurs, staff, matchs (events/stats/scores), config tournoi, statut d'équipe (enum), inscription.
6. **Création de match via Server Action** (`createMatch`) au lieu d'un insert client anon (qui était bloqué par RLS).
7. **`updatePlayerPhoto`** : l'URL doit pointer vers notre Storage Supabase.
8. **Déconnexion en POST** (server action `signOut`) au lieu d'une page GET.
9. **Uploads validés** (type MIME + taille max 10 Mo, attributs `accept`).
10. **`createAdminClient`** durci (`persistSession: false, autoRefreshToken: false`).
11. Bouton mort « Accès Team Manager » supprimé du login.

### Bugs fonctionnels
12. **Meilleurs buteurs** calculés sur **tous** les matchs terminés (plus seulement les 6 derniers).
13. **Classement de la home par groupe** (position réelle de la table `standings`, plus de mélange A/B).
14. **`venue`** utilisé partout (hero, détail match, metadata, JSON-LD) au lieu de « Stade Okano » en dur.
15. `GROUP_PHASES` unifié (`lib/helpers.ts`) ; seed corrigé (`'Groupe A'` au lieu de `'A'`) ; calcul du classement extrait en fonction pure testable (`lib/standings.ts`).
16. Montant d'inscription centralisé (`lib/constants.ts` : `REGISTRATION_FEE`).

### Qualité
17. **Lint : 176 → 0 problème** (88 `any` typés, 29 apostrophes, imports morts, `<img>` → `next/image`, règles React Compiler).
18. `.env.example` créé ; **README réécrit** avec le schéma réel de la base (vérifié par introspection).
19. Zoom mobile réactivé (suppression de `userScalable: false` — WCAG 1.4.4).
20. Dépendances mortes retirées (`react-hook-form`, `@hookform/resolvers`).

---

## ✅ Corrigé dans le code (19/07/2026)

21. **`SITE_URL` centralisé** (`lib/constants.ts`) — lire `NEXT_PUBLIC_SITE_URL` depuis l'env en priorité, fallback sur `ccfo.vercel.app`. 4 fichiers mis à jour : `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/(public)/matches/[id]/page.tsx`.
22. **`MOBILE_MONEY_NUMBER` centralisé** (`lib/constants.ts`) — lire `NEXT_PUBLIC_MOBILE_MONEY_NUMBER` depuis l'env. Suppression du placeholder `+241 00000000` codé en dur dans `RegistrationForm.tsx`.
23. **`.env.example` complet et documenté** — inclut toutes les variables requises avec explications et le avertissement critique sur `SUPABASE_SERVICE_ROLE_KEY`.

**État code après 19/07 :** `tsc --noEmit` ✓ · `eslint` 0 erreur ✓ · `next build` 28 routes ✓

---

## 🔴 RESTE À FAIRE — actions manuelles côté Supabase / Vercel

> Le code est prêt, mais ces étapes ne peuvent être faites que par vous (le connecteur Supabase de la session n'a pas accès au projet CCFO).

### 1. ⚠️ CRITIQUE : la clé service_role du `.env` est fausse
`SUPABASE_SERVICE_ROLE_KEY` contient actuellement **la clé anon** (identique à `NEXT_PUBLIC_SUPABASE_ANON_KEY`, rôle JWT `anon` vérifié). Conséquence : **toutes les écritures « admin » (régie live, validation d'équipes, ajout de joueurs…) sont bloquées par RLS en production.**
→ Dashboard Supabase → Settings → API → copier la clé **service_role** dans `.env` **et** dans les variables d'environnement Vercel.

### 2. Exécuter les migrations SQL (dossier `sql/`)
- `add_team_documents.sql` — les colonnes documents n'existent pas sur `teams` : sans elles, la soumission d'inscription avec documents échoue et les pages admin Documents/Paiements sont vides.
- `harden_profiles_trigger.sql` — **risque d'escalade en admin** : le rôle est envoyé dans les `user_metadata` (modifiables par le client). Ce script force `role = 'manager'` dans le trigger. Vérifier ensuite : `SELECT id, full_name, role FROM profiles WHERE role = 'admin';`
- `cleanup_and_storage_notes.sql` — fusion des colonnes dupliquées de `players` (`birth_date`→`date_of_birth`, `village`→`origin_village`) + procédure pour passer le bucket `team-docs` en privé.

### 3. Confidentialité du Storage
Le bucket `team-docs` (pièces d'identité, reçus) est **lisible publiquement** (vérifié le 10/07). Suivre la procédure du fichier SQL : passer le bucket en privé **après** avoir adapté l'affichage admin en URLs signées ; les photos joueurs restent publiques (affichées sur le site).

### 4. Variables Vercel à configurer avant lancement
| Variable | Valeur |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role depuis Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon |
| `NEXT_PUBLIC_SITE_URL` | `https://ccfo.vercel.app` (ou domaine final) |
| `NEXT_PUBLIC_MOBILE_MONEY_NUMBER` | `+241 XX XX XX XX` (vrai numéro) |

### 5. Vérifications complémentaires
- Lancer les **Security Advisors** Supabase (RLS policies non versionnées dans le repo — envisager `supabase/migrations/`).
- La lecture anon de `profiles` est ouverte (noms + rôles de tous les comptes) : restreindre la policy SELECT si non voulu.

---

## 🟡 Améliorations futures (non bloquantes)
- **Événements par `player_id`** au lieu du nom libre (homonymes/fautes cassent buteurs et suspensions) — la table `match_events` existe déjà mais n'est pas utilisée.
- **Colonne `matches.started_at`** au lieu du hack dans le JSON `stats`.
- **Tests** : `lib/standings.ts#computeStandings` est désormais pur et prêt à tester (vitest) ; ajouter des tests sur les guards d'autorisation et le mapping d'inscription.
- Édition du staff côté manager (actuellement création avec placeholder « Nouveau Membre » sans édition possible).
- `teams.tournament_id` et `matches.is_published` existent en base mais ne sont pas exploités par le code.

---

## ✅ Points forts confirmés
- Défense en profondeur : proxy (`proxy.ts`, conforme Next 16) → layouts → Server Actions.
- RLS activé sur toutes les tables (écritures anon bloquées — vérifié par sondes FK non persistantes).
- ISR (30 s) + Realtime pour le live ; SEO complet (metadata, sitemap, JSON-LD) ; PWA.
- `tsc --noEmit` ✓ · `eslint` 0 erreur ✓ · `next build` ✓ (19/07/2026)
