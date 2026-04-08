---
description: "Ajouter un endpoint à l'API Express"
---

# Ajouter un endpoint Express

Créez un nouvel endpoint en suivant l'architecture existante du projet AlternaGen :

## À générer

- Route Express avec GET/POST/PUT/DELETE dans `api/src/routes/`
- Controller correspondant dans `api/src/controllers/`
- Service métier dans `api/src/services/`
- Types TypeScript dans `api/src/types/`
- Test d'intégration avec Jest + Supertest dans `api/tests/`

## Conventions

- Messages d'erreur en français
- Code TypeScript strict avec type hints complets
- Réponses JSON formatées : `{ data: ..., message?: string }` pour le succès, `{ error: string }` pour les erreurs
- Codes HTTP appropriés (200, 201, 400, 401, 403, 404, 500)
- Authentification Clerk sur les routes protégées
- Validation des entrées avant traitement
- Gestion des erreurs Prisma avec try/catch

## Structure attendue

```typescript
// routes/example.routes.ts
import { Router } from 'express';
import { ExampleController } from '../controllers/example.controller';

const router = Router();
const controller = new ExampleController();

router.get('/', controller.getAll);
router.post('/', controller.create);

export default router;
```

Respectez l'architecture existante du projet.
