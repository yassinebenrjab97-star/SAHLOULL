# Sahloul IT Desk

Outil de déclaration et de suivi des pannes informatiques pour le **Service Informatique
de l'Hôpital Universitaire Sahloul** (Sousse, Tunisie).

Éditeur de tickets pour quatre familles d'équipements — **imprimante**, **écran PC**,
**unité centrale**, **imprimante QR** — avec suivi public, inventaire du matériel réformé,
espace administrateur et assistant IA intégré.

> **Mise en page éditoriale** : typographie display serif (Fraunces) + sans clinique
> (IBM Plex Sans), papier chaud hors-blanc, encre profonde, un accent rouge tranchant,
> filets de 1 px, coins coupés et texture papier. Aucun dégradé violet/bleu, aucun
> glassmorphism, aucun emoji.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Démarrage rapide](#démarrage-rapide)
- [Deux modes : démo locale ou Supabase](#deux-modes--démo-locale-ou-supabase)
- [Variables d'environnement](#variables-denvironnement)
- [Mise en place de Supabase](#mise-en-place-de-supabase)
- [Assistant IA](#assistant-ia)
- [Logo et palette](#logo-et-palette)
- [Langues (i18n)](#langues-i18n)
- [Workflow des statuts](#workflow-des-statuts)
- [Structure du projet](#structure-du-projet)
- [Scripts](#scripts)
- [Déploiement](#déploiement)

---

## Fonctionnalités

| Page | Chemin | Accès |
| --- | --- | --- |
| Accueil éditorial | `/` | public |
| Déclaration d'une panne | `/reclamation` | public |
| Suivi d'une demande | `/suivi` | public |
| Matériel réformé | `/materiel-reforme` | public, lecture seule |
| Espace administrateur | `/admin` | protégé (Supabase Auth + rôle admin) |
| Assistant IA (bulle flottante) | toutes les pages publiques | public |

- **Formulaire de déclaration** : service (liste déroulante filtrable, 55 services),
  4 tuiles d'équipement, marque dépendante de l'équipement (+ « Autre » en texte libre),
  n° de série facultatif, symptômes rapides, urgence, photo facultative, coordonnées.
  À l'envoi : génération d'un ticket `SAH-2025-0001`, confirmation « ticket imprimé » et
  bouton **Copier le numéro**.
- **Suivi** : saisie du ticket (téléphone facultatif), frise chronologique verticale avec
  dates, étape courante mise en évidence et message contextuel.
- **Espace admin** : tableau de bord filtrable et recherchable, fiche détaillée (appel /
  courriel en un clic, photo, historique), boutons de workflow, notes internes, gestion
  des services, des marques et des coordonnées, et édition/suppression de toute demande
  ou entrée réformée.
- **Assistant IA « Ilhem Eltaif Assistant »** : bulle flottante (à gauche en RTL), panneau
  de chat, dépannage des 4 types d'équipement, connaissance du workflow de l'app,
  lien vers `/reclamation`, **jamais** de conseil médical, réponse dans la langue de
  l'utilisateur (arabe inclus).
- **Thème** clair/sombre persistant (respecte le système) et **10 langues** dont l'arabe RTL.

---

## Démarrage rapide

Prérequis : **Node.js 20+** (développé et testé avec Node 24 LTS) et npm.

```bash
npm install
npm run dev      # http://localhost:5173
```

Aucune configuration n'est requise : sans variables d'environnement, l'application
démarre en **mode démo local** (données dans le navigateur) et le chat IA utilise son
moteur de secours intégré. Tout est immédiatement testable.

```bash
npm run build      # build de production dans dist/
npm run preview    # prévisualise le build
npm run typecheck  # vérification TypeScript stricte
```

---

## Deux modes : démo locale ou Supabase

Derrière une **interface unique** (`src/lib/db/adapter.ts`) coexistent deux
implémentations :

| Condition | Adaptateur | Persistance | Auth |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` définies | `supabase` | PostgreSQL via Supabase | Supabase Auth + RLS |
| Sinon | `local` | `localStorage` du navigateur | compte de démonstration |

### Identifiants de démonstration (mode local)

```
Courriel : admin@sahloul.tn
Mot de passe : sahloul2025
```

Un jeu d'exemple (demandes, matériel réformé, services, marques) est injecté au premier
chargement. Le bouton **« Réinitialiser les données de démonstration »** de
`/admin/settings` efface et régénère ces données. Les coordonnées de connexion sont
également affichées sur l'écran de connexion en mode local.

---

## Variables d'environnement

Copiez `.env.example` vers `.env` puis renseignez :

```dotenv
# Mode Supabase (production). Laisser vide = mode démo local.
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Facultatif : endpoint IA personnalisé. Vide = edge function Supabase,
# puis repli sur l'assistant local.
VITE_AI_ENDPOINT=
```

---

## Mise en place de Supabase

1. **Créez le projet** sur <https://supabase.com>, puis ouvrez l'éditeur SQL.
2. **Exécutez le schéma** : copiez-collez le contenu de
   [`supabase/schema.sql`](supabase/schema.sql) et lancez-le. Il crée les tables
   (`requests`, `request_status_history`, `services`, `brands`, `reformed_equipment`,
   `user_roles`, `site_settings`), les fonctions (`next_ticket_number`,
   `apply_status_transition`, `get_request_by_ticket`), les politiques **RLS**, le
   bucket de photos et les données de départ. Le script est ré-exécutable.
3. **Créez le premier administrateur** :
   - *Authentication → Users → Add user* (courriel + mot de passe).
   - Puis, dans l'éditeur SQL :
     ```sql
     insert into public.user_roles (user_id)
     values ('<UUID-DE-L-UTILISATEUR-AUTH>');
     ```
4. **Renseignez `.env`** avec l'URL du projet et la clé **anon** (Project Settings → API),
   puis relancez `npm run dev`.

Basculez `/admin` : la connexion se fait désormais via Supabase Auth, et le drapeau
administrateur est lu dans `user_roles` (jamais depuis le client).

### Modèle de sécurité (RLS)

- **Écriture publique** : `insert` autorisé sur `requests` **uniquement** avec
  `status = 'pending_acceptance'`. Impossible de créer une demande déjà « acceptée ».
- **Lecture du suivi** : le public n'a pas accès à la table ; il passe par la fonction
  `get_request_by_ticket`, où le numéro de ticket joue le rôle de capacité.
- **Lecture/écriture admin** : uniquement si `is_admin(auth.uid())`.
- **`reformed_equipment`, `services`, `brands`, `site_settings`** : lecture publique,
  écriture admin.
- **Transitions de statut** : passent exclusivement par `apply_status_transition`
  (SECURITY DEFINER), qui vérifie le rôle et l'ordre des étapes. « Sauter » l'acceptation
  est donc impossible, y compris côté base.

---

## Assistant IA

- **Côté client** : `src/lib/ai.ts` construit le *system prompt* (périmètre strict :
  4 types d'équipement + workflow de l'app, **aucun** conseil médical, réponse dans la
  langue de l'utilisateur) et lit le flux SSE. En l'absence d'endpoint, un moteur de
  règles local (fr/ar/en) prend le relais : le chat fonctionne toujours.
- **Côté serveur** : `supabase/functions/ai-assistant/index.ts` est un proxy vers un
  endpoint de chat compatible OpenAI, en streaming.

Déploiement :

```bash
supabase functions deploy ai-assistant --no-verify-jwt
supabase secrets set AI_API_KEY=sk-...
# Facultatif :
supabase secrets set AI_MODEL=gpt-4o-mini
supabase secrets set AI_API_URL=https://api.openai.com/v1/chat/completions
```

`supabase/config.toml` déclare `verify_jwt = false` pour cette fonction : elle est
publique (appelée par des visiteurs anonymes), ne touche pas la base et n'expose que le
proxy LLM.

---

## Logo et palette

Le logo officiel n'a pas encore été fourni : `public/logo.svg` est un **placeholder**
utilisé dans l'en-tête, le favicon (`index.html`) et l'écran de chargement.

Pour installer le vrai logo :

1. Déposez le fichier dans `public/` (par ex. `public/logo.png`).
2. Mettez à jour `src/components/Logo.tsx` (`src="/logo.png"`) **ou** remplacez
   `public/logo.svg` par le fichier officiel.
3. Ajustez le favicon dans `index.html` si le format change.

La palette (six jetons dans `src/index.css`) est une **estimation** de départ à affiner
depuis les couleurs réelles du logo :

| Jeton | Clair | Sombre | Rôle |
| --- | --- | --- | --- |
| `--background` | `#F4EEE2` | `#17140F` | papier chaud / encre |
| `--surface` | `#FCF9F3` | `#1F1C17` | papier surélevé |
| `--primary` | `#0F5A53` | `#63C3B7` | accent clinique (teal) |
| `--accent` | `#C81E37` | `#EE5A6B` | accent tranchant (rouge) |

---

## Langues (i18n)

10 langues sont fournies : **français** (défaut, langue de référence), arabe (RTL complet),
anglais, espagnol, allemand, italien, turc, portugais, russe, chinois simplifié.

- Les dictionnaires vivent dans `src/i18n/locales/*.ts`. `fr.ts` définit le type `Dict` ;
  la forme exacte des clés est imposée à toutes les langues par TypeScript.
- Vérifiez la parité des clés à tout moment :
  ```bash
  node scripts/check-locales.mjs
  ```
- Les **noms de services** restent en français : ce sont des données (base), pas de l'UI.

---

## Workflow des statuts

Ordre linéaire, la source de vérité est `src/lib/status.ts` (et son miroir SQL
`apply_status_transition`) :

```
1 En attente d'acceptation ──┬─► Acceptée ─► En attente de réparation au service informatique ─► En cours de réparation ─┬─► Réparé
                             │                                                                                        └─► Non réparable
                             └─► Refusée  (avec motif, branche terminale)
```

> **Règle critique** : tant que le statut est **« En attente d'acceptation »**, le service
> ne doit **pas** apporter l'équipement. Le suivi affiche un avertissement dans ce sens,
> puis un avis vert **« Vous pouvez maintenant apporter l'équipement au service
> informatique. »** dès l'acceptation. L'administrateur ne peut pas ignorer l'acceptation.
> Une demande **non réparable** est automatiquement ajoutée au **Matériel réformé** avec
> sa panne et son service d'origine.

---

## Structure du projet

```
src/
  components/        primitives (ui/), mise en page, carte-ticket, frise, assistant IA…
  hooks/             useTheme, useAdminSession, useSettings, useTaxonomy
  i18n/              index.ts + locales/*.ts (10 langues)
  lib/
    db/              adapter.ts (contrat) · supabase.ts · local.ts · index.ts
    ai.ts            system prompt + streaming + repli local
    constants.ts     services (55), marques, symptômes, réglages, langues
    status.ts        workflow (STATUS_FLOW, TRANSITIONS, canTransition)
    validation.ts    schémas zod + messages traduits
    ticket.ts        formatage / analyse des numéros SAH-AAAA-NNNN
    supabase.ts      client + détection de configuration
  pages/             Home, Reclamation, Suivi, MaterielReforme, NotFound, admin/*
supabase/
  schema.sql         tables, fonctions, RLS, storage, données
  functions/ai-assistant/index.ts
  config.toml
scripts/             check-locales.mjs (parité i18n)
```

---

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement Vite |
| `npm run build` | build de production (`dist/`) |
| `npm run preview` | prévisualisation du build |
| `npm run typecheck` | `tsc --noEmit`, TypeScript strict |
| `node scripts/check-locales.mjs` | vérifie que les 10 langues ont les mêmes clés |

---

## Déploiement

1. `npm run build` puis publiez `dist/` (Vercel, Netlify, Cloudflare Pages…).
2. Comme c'est une SPA (React Router), configurez une **redirection « catch-all » vers
   `/index.html`** :
   - Netlify : `/* /index.html 200` dans `_redirects` ;
   - Vercel : réécriture `{ "source": "/(.*)", "destination": "/index.html" }`.
3. Définissez `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (et au besoin
   `VITE_AI_ENDPOINT`) dans les variables d'environnement de la plateforme.
4. Déployez l'edge function `ai-assistant` et son secret (voir plus haut).

---

*Service Informatique — Hôpital Universitaire Sahloul, Sousse, Tunisie.*
