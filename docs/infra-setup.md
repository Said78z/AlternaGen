# Infra Setup & Provisioning - AlternaGen

## 🌐 Configuration DNS
1. **A Record** : `@` → `YOUR_SERVER_IP`
2. **A Record** : `www` → `YOUR_SERVER_IP`
3. **A Record** : `api` → `YOUR_SERVER_IP` (Optionnel si reverse proxy)

## 🔑 SSH & Sécurité
1. Générer une clé de déploiement :
   ```bash
   ssh-keygen -t ed25519 -C "deploy@alternagen" -f ~/.ssh/id_deploy
   ```
2. Ajouter la clé publique au serveur (`~/.ssh/authorized_keys`).
3. Ajouter la clé privée dans les **GitHub Secrets** (`DEPLOY_SSH_KEY`).

## 🛠️ Provisionnement Serveur (Quickstart)
```bash
sudo apt update && sudo apt install -y docker.io docker-compose git certbot
# Setup SSL
sudo certbot certonly --standalone -d altergenz.fr -d www.altergenz.fr
```

## 🔒 Secrets à configurer (GitHub/Env)
| Secret | Description |
| --- | --- |
| `POSTGRES_PASSWORD` | Mot de passe DB Primary |
| `STRIPE_SK` | Secret Key Stripe (Production) |
| `JWT_SECRET` | Secret pour les tokens d'authentification |
| `DEPLOY_HOST` | IP du serveur de production |
| `DEPLOY_USER` | Utilisateur SSH (root ou sudoer) |
```
