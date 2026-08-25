# Projetis — Frontend

Interface web développée avec **Nuxt 4** (Vue.js), consommant l'API du [Backend Projetis](#) (Laravel).

---

## Sommaire

- [Stack technique](#stack-technique)
- [Fonctionnalités](#fonctionnalités)
- [Installation en local](#installation-en-local)
- [Variables d'environnement](#variables-denvironnement)
- [Structure du projet](#structure-du-projet)
- [Déploiement](#déploiement)

---

## Stack technique

| Composant | Technologie |
|---|---|
| Framework | Nuxt 4 (Vue.js) |
| Langage | TypeScript |
| Style | Tailwind CSS |
| Gestion d'état | Pinia |
| Tableaux paginés | `@bhplugin/vue3-datatable` |
| Icônes | `lucide-vue-next` |
| Alertes/confirmations | SweetAlert2 |

---

## Fonctionnalités

- **5 espaces dédiés** selon le rôle connecté (étudiant, encadreur, administrateur, super administrateur, jury externe), avec menu latéral adapté.
- **Thème clair/sombre**, mémorisé entre les sessions.
- **Déconnexion automatique** après 10 minutes d'inactivité, avec avertissement 30 secondes avant.
- **Notifications en temps réel** (cloche, pastille de compteur, polling toutes les 30 secondes) pour le super administrateur.
- **Tableaux avec recherche, filtres et pagination** pour toutes les listes de gestion (étudiants, encadreurs, projets...).
- **Historique d'activité** consultable (super administrateur), avec filtres par type et recherche textuelle.

---

## Installation en local

Prérequis : Node.js, et le [Backend](#) démarré (ou son URL configurée).

```bash
git clone <url-du-depot>
cd Frontend
npm install
npm run dev
```

L'application est ensuite disponible sur `http://localhost:3000`.

---

## Variables d'environnement

Configurées dans `nuxt.config.ts` (`runtimeConfig.public`), surchargeables via variable d'environnement :

| Variable | Rôle | Valeur locale par défaut |
|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | URL de base de l'API backend | `http://localhost:8000/api` |

En production (Vercel), cette variable est définie dans **Settings → Environment Variables**, pointant vers l'URL du backend déployé (Railway) suivie de `/api`.

---

## Structure du projet

```
app/
├── pages/              # Une page par route, organisées par rôle
│   ├── admin/
│   ├── super-admin/
│   ├── encadreur/
│   ├── etudiant/
│   └── jury/
├── components/          # Composants réutilisables (FormInput, SelectPersonnalise...)
├── Composables/         # Logique réutilisable (useApi, useAuth, useInactivite...)
├── stores/              # Stores Pinia (auth...)
└── layouts/             # Layout principal du tableau de bord (sidebar, header)
```

---

## Déploiement

Hébergé sur **[Vercel](https://vercel.com)**, déployé automatiquement à chaque push sur la branche `develop` (branche de production configurée dans Settings → Environments).

 **Si le déploiement automatique semble bloqué** (aucun nouveau build après un push malgré un commit visible sur GitHub) : le lien webhook GitHub ↔ Vercel peut se désynchroniser. Solution : Settings → Git → déconnecter puis reconnecter le dépôt, ou déployer directement avec la CLI :

```bash
npm install -g vercel
vercel login
vercel --prod
```

### CORS

Le backend autorise dynamiquement toutes les URLs de déploiement Vercel de ce projet (production **et** prévisualisations, qui changent à chaque déploiement) via un motif d'expression régulière côté Laravel — aucune configuration CORS supplémentaire n'est nécessaire côté frontend lors d'un nouveau déploiement.