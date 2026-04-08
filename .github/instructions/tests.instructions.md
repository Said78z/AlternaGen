---
applyTo: "**/tests/**/*.ts"
description: "Instructions pour les tests"
---

# Conventions pour les tests - AlternaGen

## Outils et frameworks

- Utiliser **Jest** comme framework de test principal
- Utiliser **Supertest** pour les tests d'intégration des routes HTTP
- Organiser les tests dans le dossier `tests/` à la racine du module concerné

## Structure des tests

- Écrire des tests unitaires pour chaque controller, service et utilitaire
- Écrire des tests d'intégration pour chaque route HTTP
- Grouper les tests par fonctionnalité avec `describe`
- Nommer les tests de manière descriptive avec `it` ou `test`

## Conventions de nommage

- Fichiers de test : `<nom-du-module>.test.ts`
- Blocs `describe` : nommer par la fonctionnalité testée (ex : `describe('GET /jobs', ...)`)
- Blocs `it`/`test` : décrire le comportement attendu (ex : `it('should return 200 with job list', ...)`)

## Bonnes pratiques

- Tester les cas normaux (happy path) et les cas d'erreur
- Ajouter des assertions explicites avec `expect`
- Mocker les dépendances externes (Prisma, Clerk, OpenAI) avec `jest.mock`
- Utiliser `beforeEach`/`afterEach` pour l'initialisation et le nettoyage
- Viser une couverture de code supérieure à 80%

## Exemple de structure de test

```typescript
import request from 'supertest';
import app from '../src/index';

describe('GET /health', () => {
    it('should return 200 and database status', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return 500 if database is unreachable', async () => {
        // Mock database failure
        const response = await request(app).get('/health');
        expect(response.status).toBeGreaterThanOrEqual(200);
    });
});
```
