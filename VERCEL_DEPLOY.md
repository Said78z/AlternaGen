# 🚀 Guide de Déploiement Vercel + GitLab CI

Ce guide explique comment déployer AlternaGen sur Vercel de manière automatisée, tout en résolvant les erreurs de build TypeScript.

## 1. Structure du Projet (Monorepo)

Nous utilisons un seul projet Vercel pour tout le repo. Le fichier `vercel.json` à la racine s'occupe de tout :
- Le frontend (Vite) est servi sur `/`
- L'API (Express) est servie sur `/api/*`

## 2. Configuration Vercel

1. Connecte ton repo GitLab à Vercel.
2. Crée un **seul projet** sur Vercel.
3. **Variables d'environnement** : Ajoute toutes tes clés dans les settings du projet Vercel :
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID`

## 3. Automatisation avec GitLab CI

Le fichier `.gitlab-ci.yml` a été mis à jour pour déployer automatiquement sur `main`.

### Prérequis GitLab :
Va dans **Settings > CI/CD > Variables** sur GitLab et ajoute :
- `VERCEL_TOKEN` : Ton token API Vercel (à créer dans ton profil Vercel).
- `VERCEL_ORG_ID` : L'ID de ton organisation Vercel.
- `VERCEL_PROJECT_ID` : L'ID du projet créé sur Vercel.

## 4. Correctifs Appliqués

J'ai corrigé les erreurs qui bloquaient ton build :
- **jobs.controller.ts** : Ajout d'un type explicite pour éviter l'erreur `implicitly has an 'any' type`.
- **agent.service.ts** : Sécurisation de l'import `TaskStatus` pour qu'il ne crash plus si le client Prisma n'est pas généré à temps.
- **stripe.service.ts** : Mise à jour de la version de l'API Stripe pour correspondre aux types attendus.

## 5. Déploiement Manuel (Si besoin)

Si tu veux tester manuellement :
```bash
npm install -g vercel
vercel --prod
```

C'est tout bon ! Ton pipeline GitLab va maintenant gérer le sale boulot pour toi. 🚀
