---
applyTo: "**/*"
description: "Configuration pour le projet AlternaGen"
---

# Instructions GitHub Copilot - AlternaGen

Ce projet est une **plateforme SaaS** d'aide à la recherche d'alternance propulsée par l'IA. Il utilise une architecture moderne et modulaire avec les technologies suivantes :

- **Frontend** : Vite + React + TypeScript
- **Backend** : Express + TypeScript avec architecture modulaire (controllers, routes, services)
- **Base de données** : PostgreSQL avec Prisma ORM
- **Auth** : Clerk
- **IA** : OpenAI API
- **Tests** : Jest + Supertest
- **Déploiement** : Docker + GitHub Actions + GHCR

## 🏗️ Architecture du projet

### Structure des dossiers

```text
altergen/
├── api/                           # Backend Express + TypeScript
│   ├── src/
│   │   ├── index.ts               # Point d'entrée Express
│   │   ├── controllers/           # Logique métier des routes
│   │   ├── middleware/            # Middlewares Express
│   │   ├── routes/                # Définition des routes
│   │   ├── services/              # Services métier
│   │   ├── types/                 # Types TypeScript
│   │   └── utils/                 # Utilitaires
│   ├── tests/                     # Tests Jest + Supertest
│   └── prisma/                    # Schéma et migrations Prisma
├── web/                           # Frontend Vite + React + TypeScript
├── infra/                         # Infrastructure as Code (Terraform)
├── docs/                          # Documentation
└── .github/                       # CI/CD et configuration Copilot
```

## 🛠️ Conventions de développement

### Style de code

- **TypeScript** : Respect strict de la configuration tsconfig, types explicites pour toutes les fonctions publiques
- **Imports** : Organisés par groupes (Node stdlib, dépendances tierces, modules locaux)
- **Variables** : camelCase pour variables et fonctions, PascalCase pour classes et interfaces
- **Type hints** : Obligatoires pour tous les paramètres et retours de fonctions publiques
- **Nommage des routes** : kebab-case pour les URLs (ex : `/api/job-offers`)
- **Nommage des fichiers** : kebab-case avec suffixe de type (ex : `jobs.controller.ts`, `jobs.routes.ts`)

### Architecture backend

- **Controllers** : Gèrent la logique de traitement des requêtes HTTP, délèguent aux services
- **Services** : Contiennent la logique métier et les interactions avec la base de données via Prisma
- **Routes** : Définissent les endpoints et appliquent les middlewares appropriés
- **Middleware** : Authentification Clerk, validation, gestion d'erreurs

### Conventions de réponse API

- Toujours retourner des réponses JSON structurées
- Utiliser des codes HTTP appropriés (200, 201, 400, 401, 403, 404, 500)
- Format de réponse succès : `{ data: ..., message?: string }`
- Format de réponse erreur : `{ error: string, details?: any }`
- Messages d'erreur en français

### Sécurité

- Utiliser Helmet pour les headers de sécurité
- Valider et assainir toutes les entrées utilisateur
- Utiliser l'authentification Clerk pour les routes protégées
- Ne jamais exposer les données sensibles dans les réponses

### Base de données

- Utiliser Prisma ORM pour toutes les interactions avec la base de données
- Définir les schémas dans `api/prisma/schema.prisma`
- Toujours gérer les erreurs Prisma avec try/catch
