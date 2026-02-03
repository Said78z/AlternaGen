# 🚀 QUICK DEPLOY GUIDE - altergenz.fr

## ⚡ OPTION 1: Local Test (5 min)

### 1. Update Environment Variables

**Backend (.env):**
```bash
cd api
nano .env
```

Update these:
```env
# Use LIVE keys for production
CLERK_SECRET_KEY=sk_live_YOUR_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY

# Keep test keys for now
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY

# OpenAI (already set)
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY
```

**Frontend (.env):**
```bash
cd ../web/kassy-kube
nano .env
```

Update:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
VITE_API_URL=http://localhost:3001
```

### 2. Deploy Locally

```bash
cd ../..
sudo ./deploy.sh
```

**This will:**
- ✅ Build Docker images
- ✅ Start all services
- ✅ Run database migrations
- ✅ Health checks

### 3. Test

Open http://localhost:3001 and verify:
- [ ] Landing page loads
- [ ] Sign up with Google works
- [ ] Dashboard accessible
- [ ] CV generator works
- [ ] Credits counter shows

---

## 🌍 OPTION 2: Deploy to Server (30 min)

### Prerequisites
- Server with Docker installed
- Domain altergenz.fr pointing to server IP
- SSH access

### 1. SSH to Server

```bash
ssh root@YOUR_SERVER_IP
```

### 2. Clone Repository

```bash
cd /var/www
git clone YOUR_REPO_URL altergen
cd altergen
```

### 3. Configure Environment

```bash
# Backend
cd api
cp .env.example .env
nano .env
# Update all keys (Clerk LIVE, Stripe, OpenAI)

# Frontend
cd ../web/kassy-kube
cp .env.example .env
nano .env
# Update Clerk key and API URL
```

### 4. Deploy

```bash
cd ../..
sudo ./deploy.sh
```

### 5. Setup Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/altergenz.fr
```

Paste:
```nginx
server {
    listen 80;
    server_name altergenz.fr www.altergenz.fr;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/altergenz.fr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d altergenz.fr -d www.altergenz.fr
```

### 7. Verify

```bash
curl https://altergenz.fr
curl https://altergenz.fr/health
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] DNS resolves to server
- [ ] SSL certificate active
- [ ] Frontend loads on altergenz.fr
- [ ] API responds on /health
- [ ] Google OAuth works
- [ ] LinkedIn OAuth works (activate in Clerk)
- [ ] CV generation works
- [ ] Stripe checkout works
- [ ] Mobile responsive
- [ ] No console errors

---

## 🔧 TROUBLESHOOTING

### "Cannot connect to database"
```bash
docker-compose logs db
# Check DATABASE_URL in api/.env
```

### "Clerk authentication failed"
```bash
# Verify you're using LIVE keys (pk_live_*, sk_live_*)
# Update allowed origins in Clerk dashboard
```

### "502 Bad Gateway"
```bash
docker-compose logs api
# Check if API container is running
docker-compose ps
```

---

## 📊 MONITORING

### View Logs
```bash
# All services
docker-compose logs -f

# API only
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart API only
docker-compose restart api
```

### Update Code
```bash
git pull
docker-compose build
docker-compose up -d
```

---

**Status**: 🟢 READY TO DEPLOY

Choose your option and GO! 🚀
