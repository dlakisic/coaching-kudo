# 🥋 Coaching Kudo

Application web progressive (PWA) complète pour le suivi et coaching des compétiteurs de kudo. Système de gestion centralisé permettant aux coachs de suivre leurs athlètes avec des outils modernes de communication et d'analyse.

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
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Push Notifications VAPID Keys (optionnel)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@domain.com
```

### 4. Base de données

Importer les schémas de base de données depuis le dossier `database/` :

1. **Schéma principal** : Exécuter `database/notifications-schema.sql`
2. **Calendrier** : Exécuter `database/calendar-schema.sql` 
3. **Permissions** : Exécuter `database/hierarchy-permissions.sql`
4. **Données de test** (optionnel) : `database/test-users.sql`

### 5. Notifications Push (optionnel)

Pour activer les notifications push :
```bash
# Générer les clés VAPID
node scripts/generate-vapid-keys.js
```

Puis ajouter les clés générées dans `.env.local`.

## Développement

```bash
# Démarrer le serveur de développement
pnpm dev

# Tests
pnpm test

# Vérification TypeScript
pnpm typecheck

# Linter
pnpm lint

# Build production
pnpm build

# Test des notifications (développement)
# Accéder à /notifications-test pour l'interface de test
```

## Structure du projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── admin/             # Interface d'administration
│   ├── api/               # API Routes
│   ├── athletes/          # Gestion des athlètes
│   ├── calendar/          # Système de calendrier
│   ├── dashboard/         # Tableaux de bord
│   ├── notes/             # Gestion des notes
│   ├── notifications-test/ # Interface de test notifications
│   └── recommendations/   # Système de recommandations
├── components/            # Composants réutilisables
│   ├── calendar/         # Composants calendrier
│   ├── modals/           # Composants modaux
│   ├── notifications/    # Composants notifications
│   └── ui/               # Composants UI de base
├── hooks/                # Hooks React personnalisés
├── lib/                  # Services et configuration
├── schemas/              # Schémas de validation
├── services/             # Logique métier
├── types/                # Types TypeScript
└── utils/                # Utilitaires
```

## 🚀 Fonctionnalités

### ✅ Système d'authentification et profils
- Authentification Supabase (coach/athlète)
- Gestion hiérarchique des utilisateurs (super admin, coach principal, coach junior)
- Profils complets avec photos et informations sportives

### ✅ Gestion des athlètes
- Profils détaillés (catégorie, grade, poids, mensurations)
- Historique des performances
- Interface d'édition complète
- Sections notes et recommandations dédiées

### ✅ Système de notes d'entraînement
- Création et édition de notes détaillées
- Catégorisation par type d'entraînement
- Interface intuitive avec modales
- Historique complet par athlète

### ✅ Recommandations personnalisées
- Système de recommandations ciblées
- Suivi des progrès
- Interface de création rapide
- Gestion des statuts (en cours, terminé, etc.)

### ✅ Calendrier intégré
- Vue mensuelle, hebdomadaire et quotidienne
- Gestion des événements d'entraînement
- Interface de création d'événements
- Détails complets par événement

### ✅ Notifications push (PWA)
- Système de notifications push modernes
- Types prédéfinis (entraînement, motivation, social, tâche, urgence)
- Interface de test pour développement
- Support VAPID pour sécurité

### ✅ Interface d'administration
- Gestion centralisée des utilisateurs
- Administration des coachs
- Outils de développement intégrés
- Scripts de base de données

### ✅ PWA (Progressive Web App)
- Installation sur mobile/desktop
- Mode hors ligne
- Notifications natives
- Interface adaptative

### ✅ Thème sombre
- Support complet du thème sombre
- Persistance des préférences
- Interface moderne et adaptée

## 📱 Tableaux de bord spécialisés

- **Dashboard Coach** : Vue d'ensemble des athlètes, statistiques, notifications
- **Dashboard Athlète** : Progression personnelle, objectifs, calendrier
- **Dashboard Admin** : Gestion système, utilisateurs, permissions

## 🛠️ Stack technique

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Auth + RLS + API)
- **PWA:** next-pwa + Service Workers
- **Notifications:** Web Push API + VAPID
- **Tests:** Vitest + Testing Library
- **Validation:** Zod schemas
- **Package Manager:** PNPM
- **Déploiement:** Vercel

## 🔧 Scripts utiles

```bash
# Génération des clés VAPID pour notifications
node scripts/generate-vapid-keys.js

# Réinitialisation des policies RLS (développement)
node scripts/reset-rls-policies.sql

# Tests des notifications
http://localhost:3000/notifications-test
```

## 📋 Prochaines fonctionnalités

- [ ] Gamification (points, badges, classements)
- [ ] Analyse avancée des performances
- [ ] Intégrations externes (calendriers, APIs)
- [ ] Rapports automatisés
- [ ] Chat en temps réel
- [ ] Vidéos d'entraînement intégrées

## 📄 Licence

Ce projet est sous licence privée. Tous droits réservés.