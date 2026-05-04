# 📋 Audit Complet — CCFO Platform
*Généré le 04/05/2026*

---

## ✅ Ce qui est Fonctionnel

### Navigation & Layout
- **Sidebar desktop** — Affichage correct avec liens admin et manager, rôle conditionnel ✅
- **BottomNav mobile** — Présente avec menu "hamburger" plein écran pour admin ✅
- **Header sticky** — Logo, bouton notification, avatar utilisateur ✅
- **Routage protégé** — Middleware d'authentification Supabase en place ✅
- **PWA / Install Prompt** — Composant intégré dans le layout ✅

### Dashboard Admin (`/dashboard`)
- Affichage conditionnel selon le rôle (admin vs manager) ✅
- Statistiques : équipes, paiements validés, matchs joués (fetch server-side) ✅
- Tableau résumé des dernières équipes avec statut ✅

### Dashboard Manager (`/dashboard`)
- Jauges de progression (joueurs/staff) ✅
- Affichage du statut de dossier avec messages contextuels ✅
- Bloc "Prochain match" ✅
- Liens vers inscription et équipe ✅

### Gestion des Équipes (`/admin/teams`)
- Fetch des équipes avec compteurs joueurs/staff ✅
- Statistiques (total, validées, en attente, rejetées) ✅
- Actions rapides : valider / rejeter (avec mise à jour Supabase) ✅
- Barres de progression joueurs/staff dans le tableau ✅

### Gestion des Joueurs (`/admin/players`)
- Fetch complet avec join équipe ✅
- Génération de licence joueur (carte numérique) ✅
- Impression via `window.print()` ✅
- Photo joueur avec fallback initial ✅

### Programmation des Matchs (`/admin/matches`)
- Formulaire de création de match (équipe dom/ext, date, lieu) ✅
- Validation "équipe ne peut pas s'affronter elle-même" ✅
- Suppression de match ✅
- Lien vers page de régie live ✅

### Régie Live (`/admin/matches/[id]`)
- Contrôle du score +/- ✅
- Changement de statut (prévu / en direct / terminé) ✅
- Timeline d'événements (buts, cartons jaunes/rouges) ✅
- Sauvegarde et publication vers Supabase ✅

### Calendrier Public (`/dashboard/matches`)
- Affichage séparé matchs à venir / résultats ✅
- MatchCard responsive avec date et lieu ✅
- Barre de recherche (UI présente, logique non branchée) ⚠️

### Mon Équipe (`/dashboard/my-team`)
- Affichage du header équipe avec infos ✅
- Liste staff en grille ✅
- Grille joueurs avec cards éditables ✅
- Upload photo joueur vers Supabase Storage ✅
- Édition inline (nom, numéro, poste, village) ✅

### Inscription (`/manager/registration`)
- Formulaire multi-étapes (5 steps) ✅
- Step 1 : infos générales équipe ✅
- Step 3 : tableau 24 joueurs avec scroll ✅
- Step 2 : tableau 6 membres du staff ✅
- Step 4 : upload documents (UI présente) ✅
- Step 5 : engagement + affichage frais (150.000 FCFA) ✅
- Navigation précédent/suivant ✅

### Configuration Tournoi (`/admin/tournaments`)
- Formulaire éditable (nom, dates, quotas) ✅
- Toggle modifier/enregistrer ✅

---

## ❌ Ce qui n'est PAS Fonctionnel / À Construire

| Page / Feature | Problème |
|---|---|
| **`/admin/payments`** | Page stub — aucune donnée réelle, compteurs figés à 0 |
| **`/admin/staff`** | Page stub — liste vide, aucun fetch Supabase |
| **`/admin/documents`** | Page stub — aucune interface de revue, aucun fetch |
| **Recherche joueurs** | Input présent mais non branché sur le state |
| **Export PDF équipes** | Bouton présent, aucune action |
| **Filtres équipes** | Bouton "Filtrer" présent, aucune logique |
| **Recherche matchs** | Input présent, non fonctionnel (page server component) |
| **Step 2 & 3 Registration** | Les inputs du tableau ne sont pas liés au state React (données perdues) |
| **Upload documents (Step 4)** | `DocUpload` n'a aucun `onChange` / logique d'upload |
| **Bouton "Payer maintenant"** | Aucune intégration de paiement |
| **Config Tournoi** | Le bouton "Enregistrer" ne sauvegarde rien en base |
| **Classement public** | Route `/standings` existe mais page non vérifiée |
| **`/admin/matches` link** | Le lien "Gérer" pointe vers `/admin/matches/${id}` mais la page vérifie l'existence d'une colonne `events` JSONB qui doit être créée manuellement via SQL |
| **Bouton "Voir détails" équipe** | Aucun `href`, action morte |
| **Bouton "Ajouter un joueur"** | Dans `my-team`, aucun formulaire d'ajout |

---

## ⚠️ Problèmes Mobiles & Responsivité à Corriger

### Tableaux non responsifs (critique)
| Tableau | Problème |
|---|---|
| **Admin Équipes** (`/admin/teams`) | 7 colonnes fixes → déborde sur mobile malgré `overflow-x-auto` |
| **Admin Joueurs** (`/admin/players`) | 6 colonnes, colonne "Village (Origine)" disparaît sur petit écran |
| **Dashboard Admin** (tableau rapide) | 3 colonnes, lisible mais peut être amélioré |
| **Registration Step 2 & 3** | Tableaux 5 colonnes très serrés sur mobile, inputs quasi inutilisables |

### Layout
- **Action buttons dans les lignes de tableau** : sur mobile, l'effet `opacity-0 group-hover:opacity-100` ne se déclenche pas (pas de hover sur touch) — boutons invisibles sur mobile
- **Stepper inscription** : les connecteurs entre étapes disparaissent sur très petit écran (<375px)
- **Page My Team** : le header de l'équipe (`text-4xl lg:text-5xl`) peut être trop grand sur iPhone SE
- **Match detail card** dans `/admin/matches` : le layout `flex-col md:flex-row` fonctionne, mais l'alignement peut être serré

### Autres
- `opacity-0 lg:opacity-0 group-hover:opacity-100` sur les actions de ligne de tableau : **invisible sur mobile** (les boutons d'action ne s'affichent pas sur téléphone)
- `sports-card` a `hover:scale-[1.01]` qui peut causer des micro-sauts sur mobile

---

## 🔧 Améliorations Prioritaires Suggérées

1. **[URGENT] Rendre les boutons d'action toujours visibles sur mobile** — supprimer l'`opacity-0` sur les boutons de ligne de tableau sur petits écrans
2. **[URGENT] Fixer les inputs Step 2 & 3 de l'inscription** — les lier correctement au state
3. **[URGENT] Tableaux responsifs** — version "card list" sur mobile pour les tableaux larges
4. **[MOYEN] Compléter `/admin/payments`** — fetch des paiements / frais d'inscription
5. **[MOYEN] Compléter `/admin/staff`** — fetch depuis la table `staff`
6. **[MOYEN] Config Tournoi** — brancher la sauvegarde sur Supabase
7. **[MOYEN] Recherche joueurs** — filtrer `players` state avec l'input
8. **[BAS] Upload documents** — brancher le composant `DocUpload` sur Supabase Storage

---

## 📊 Score Global Responsivité

| Section | Score Mobile |
|---|---|
| Layout général (header + nav) | ✅ 9/10 |
| Dashboard admin | ✅ 8/10 — tableau OK avec scroll |
| Dashboard manager | ✅ 9/10 |
| Admin Équipes | ⚠️ 5/10 — trop de colonnes, boutons invisibles |
| Admin Joueurs | ⚠️ 6/10 — scroll OK mais boutons invisibles |
| Admin Matchs | ✅ 8/10 |
| Régie Live | ✅ 7/10 |
| Mon Équipe | ✅ 8/10 |
| Inscription (steps) | ⚠️ 5/10 — tableaux Steps 2/3 très serrés |
| Calendrier Matchs | ✅ 8/10 |

