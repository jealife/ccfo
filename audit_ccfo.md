# 📋 Audit Complet — CCFO Platform
*Dernière mise à jour : 19/07/2026 — Vérification de l'infrastructure Supabase (clés & base)*

---

## 🔍 Contexte
Audit complet mené le 10/07/2026 (code + base de données réelle via les clés du `.env`), suivi d'une passe de correction intégrale le 11/07/2026 : `next build` ✓, `tsc --noEmit` ✓, `eslint` 0 erreur / 0 warning.
Audit de déploiement le 19/07/2026 : 5 corrections de code supplémentaires (constantes, URL, Mobile Money).
Re-vérification complète de l'infrastructure (19/07/2026) : audit de la base de données réelle pour confirmer les actions manuelles.

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

## 🔴 RESTE À FAIRE — Dernières actions manuelles (Supabase / Vercel)

> Bonne nouvelle : La clé `service_role` est désormais correcte (vérifié en base, le rôle JWT est bien `service_role`) ! Les actions d'administration fonctionneront.
> Bonne nouvelle : La migration `add_team_documents.sql` a bien été exécutée (les colonnes sont présentes sur la table `teams`).

### 1. Finaliser le nettoyage SQL (`sql/cleanup_and_storage_notes.sql`)
La fusion des colonnes de `players` a été amorcée, mais les anciennes colonnes existent toujours.
→ Dans le SQL editor, vous pouvez maintenant exécuter :
```sql
ALTER TABLE public.players DROP COLUMN IF EXISTS birth_date;
ALTER TABLE public.players DROP COLUMN IF EXISTS village;
```

### 2. Confidentialité du Storage
Le bucket `team-docs` (pièces d'identité, reçus) est toujours **lisible publiquement** (vérifié lors du dernier audit).
→ Suivre la procédure du fichier SQL : passer le bucket en privé **après** avoir adapté l'affichage admin en URLs signées. Les photos joueurs resteront publiques.

### 3. Variables Vercel à configurer avant lancement
Le `.env` local est propre, assurez-vous de répliquer ces variables sur **Vercel** :
| Variable | Valeur |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | La nouvelle clé (correcte) |
| `NEXT_PUBLIC_MOBILE_MONEY_NUMBER` | `+241 66 75 03 29` |
| `NEXT_PUBLIC_SITE_URL` | L'URL de production |

### 4. Note sur les données (Classement)
Le classement s'affiche vide. L'audit montre que c'est une question de données et non de code : le seul match actuellement en base n'a pas de `group_name` (valeur `null`). La vue SQL `standings` a besoin d'un groupe pour classer les équipes. Lors de la saisie des vrais matchs, veillez à bien assigner le groupe.

### 5. Vérifications complémentaires
- Lancer les **Security Advisors** Supabase (RLS policies non versionnées dans le repo).
- La lecture anon de `profiles` est toujours ouverte (noms + rôles de tous les comptes lisibles). Restreindre la policy SELECT si ce n'est pas voulu.

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
