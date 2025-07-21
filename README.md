# Application Coaching Kudo

Application web progressive (PWA) pour le suivi et coaching des compétiteurs de kudo.

## Configuration

### 1. Prérequis
- Node.js 18+ et PNPM
- Compte Supabase

### 2. Installation
```bash
pnpm install
```

### 3. Configuration Supabase

1. Créer un projet sur [Supabase](https://supabase.com)
2. Copier `.env.local.example` vers `.env.local`
3. Remplir les variables d'environnement :
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Base de données
Exécuter le script SQL dans l'éditeur SQL de Supabase :
```sql
-- Contenu du fichier database/schema.sql
```

## Développement

```bash
# Démarrer le serveur de développement
pnpm dev

# Vérification TypeScript
pnpm typecheck

# Linter
pnpm lint

# Build production
pnpm build
```

## Structure du projet

```
src/
├── app/              # Pages Next.js (App Router)
├── components/       # Composants réutilisables
├── lib/             # Utilitaires et configuration
└── types/           # Types TypeScript
```

## Fonctionnalités MVP

- ✅ Authentification (coach/athlète)
- ✅ Gestion des profils
- 🔄 Prise de notes d'entraînement
- 🔄 Système de recommandations
- 🔄 Tableaux de bord spécialisés

## Stack technique

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Auth + API)
- **Déploiement:** Vercel
- **Package Manager:** PNPM