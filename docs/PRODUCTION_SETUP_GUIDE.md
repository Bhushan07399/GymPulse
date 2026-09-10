# GYMPULSE — PRODUCTION SETUP & DEPLOYMENT GUIDE

**Target Release**: GymPulse v1.0.1
**Target Environment**: Production Pilot (First Real Gym Onboarding)

---

## 1. PRODUCTION ARCHITECTURE

GymPulse follows a clean 3-tier SaaS architecture designed for multi-tenant isolation, speed, and reliability.

```
                                 ┌───────────────────────────────┐
                                 │   Gym Owner / Member Clients  │
                                 └───────────────┬───────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
          ┌───────────────────────────┐                     ┌───────────────────────────┐
          │     Owner Web Dashboard   │                     │     Mobile Native Apps    │
          │   (Next.js 16 App Router) │                     │ (React Native / Expo EAS) │
          │  dashboard.gympulse.in    │                     │  Owner & Member Apps      │
          └─────────────┬─────────────┘                     └─────────────┬─────────────┘
                        │                                                 │
                        └────────────────────────┬────────────────────────┘
                                                 │ HTTPS (TLS 1.3)
                                                 ▼
                                    ┌───────────────────────────┐
                                    │    Nginx Reverse Proxy    │
                                    │      api.gympulse.in      │
                                    └────────────┬──────────────┘
                                                 │ Reverse Proxy
                                                 ▼
                                    ┌───────────────────────────┐
                                    │   Express API (PM2 Server)│
                                    │     Node.js v20+ / Port   │
                                    └────────────┬──────────────┘
                                                 │ Connection Pool
                                                 ▼
                                    ┌───────────────────────────┐
                                    │    PostgreSQL Database    │
                                    │     v16+ (SSL Encrypted)  │
                                    └───────────────────────────┘
```

### Component Details
1. **API Server (`apps/api`)**: Node.js v20+ running Express v5 with Helmet headers, rate-limiting (`express-rate-limit`), Morgan logger, JWT auth, and PostgreSQL `pg` connection pool.
2. **PostgreSQL Database**: Relational multi-tenant engine storing tenant gyms, staff, members, attendance, payments, classes, and 3-day Growth trial timestamps.
3. **Owner Web App (`apps/owner-web`)**: Next.js 16 SSR/Static app providing owner dashboard, member management, reception actions, financial reports, and subscription management.
4. **Owner Mobile App (`apps/owner-mobile`)**: React Native / Expo mobile app for gym owners and staff with live KPI dashboard and reception camera QR scanner.
5. **Member Mobile App (`apps/member-mobile`)**: React Native / Expo mobile app for gym members with active status cards, dynamic QR passes, attendance ledgers, and class schedule browsing.
6. **DNS & Security**: Nginx reverse proxy terminating HTTPS with TLS 1.3 certificates (`api.gympulse.in`, `dashboard.gympulse.in`).

---

## 2. API DEPLOYMENT

### Server Requirements
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **Process Manager**: PM2 (`npm install -g pm2`)

### Deployment Steps
```bash
# 1. Clone repository to production server
git clone https://github.com/Bhushan07399/GymPulse.git /var/www/gympulse
cd /var/www/gympulse

# 2. Install production dependencies for API
cd apps/api
npm ci --omit=dev

# 3. Configure production environment file
cp .env.example .env
nano .env  # Configure production variables (see Section 4)

# 4. Run database migrations
node src/db/migrate.js

# 5. Start API server under PM2 process manager
pm2 start src/server.js --name "gympulse-api"
pm2 save
pm2 startup
```

### Health Check Endpoint
Verify API health via HTTP/HTTPS:
```bash
curl -i https://api.gympulse.in/api/v1/health
```
**Expected Response**:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "service": "GymPulse API"
}
```

---

## 3. NGINX REVERSE PROXY CONFIGURATION

Save this configuration as `/etc/nginx/sites-available/gympulse-api`:

```nginx
# HTTP - Redirect all traffic to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.gympulse.in;

    return 301 https://$host$request_uri;
}

# HTTPS - Proxy to Express API Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.gympulse.in;

    # SSL Certificates (Managed by Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/api.gympulse.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.gympulse.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Body Size Limit
    client_max_body_size 5M;

    # API Reverse Proxy
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/gympulse-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. PRODUCTION ENVIRONMENT VARIABLES

### API (`apps/api/.env`)
```bash
# Required Runtime Config
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://gympulse_user:<SECURE_PASSWORD>@localhost:5432/gympulse_prod
DATABASE_SSL=true
JWT_SECRET=<GENERATE_64_CHAR_RANDOM_HEX_SECRET>
CORS_ORIGIN=https://dashboard.gympulse.in
LOG_LEVEL=info

# Optional Meta WhatsApp Integration (Leave blank for local simulation mode)
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_BUSINESS_ACCOUNT_ID=
```

### Owner Web (`apps/owner-web/.env.production`)
```bash
NEXT_PUBLIC_API_URL=https://api.gympulse.in/api/v1
```

### Owner Mobile (`apps/owner-mobile/.env.production`)
```bash
EXPO_PUBLIC_API_URL=https://api.gympulse.in/api/v1
```

### Member Mobile (`apps/member-mobile/.env.production`)
```bash
EXPO_PUBLIC_API_URL=https://api.gympulse.in/api/v1
```

---

## 5. DATABASE CONFIGURATION & MANAGEMENT

### PostgreSQL 16 Production Setup
```sql
-- Run as postgres superuser
CREATE USER gympulse_user WITH PASSWORD 'SECURE_PASSWORD_HERE';
CREATE DATABASE gympulse_prod OWNER gympulse_user;
GRANT ALL PRIVILEGES ON DATABASE gympulse_prod TO gympulse_user;
```

### Key Settings
- **Timezone**: Set PostgreSQL timezone to `UTC`.
- **SSL**: Set `DATABASE_SSL=true` in `apps/api/.env` for cloud database services (DigitalOcean Managed DB, AWS RDS).
- **Connection Pool**: The API configures pool size automatically via `pg.Pool` (default max: 20 connections).
- **Migration Command**:
  ```bash
  cd apps/api
  node src/db/migrate.js
  ```

---

## 6. PM2 PROCESS MANAGEMENT

Create `apps/api/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'gympulse-api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/gympulse-api-error.log',
      out_file: '/var/log/pm2/gympulse-api-out.log',
      merge_logs: true
    }
  ]
};
```

Commands:
```bash
pm2 start ecosystem.config.js --env production
pm2 status
pm2 logs gympulse-api
```

---

## 7. BACKUP & RESTORE STRATEGY

Create `/opt/scripts/backup_gympulse_db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/gympulse"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/gympulse_prod_$TIMESTAMP.sql.gz"
DB_NAME="gympulse_prod"
DB_USER="gympulse_user"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting PostgreSQL backup for $DB_NAME..."
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$FILENAME"

echo "[$(date)] Backup completed: $FILENAME ($(du -h "$FILENAME" | cut -f1))"

# Retention Policy: Delete backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete

# Sync to off-site cloud storage (Cloudflare R2 / S3) if rclone is configured
if command -v rclone &> /dev/null; then
    rclone sync "$BACKUP_DIR" r2:gympulse-db-backups/
    echo "[$(date)] Off-site backup sync complete."
fi
```

Make executable & add cron job (`crontab -e`):
```cron
# Run backup daily at 2:00 AM
0 2 * * * /opt/scripts/backup_gympulse_db.sh >> /var/log/gympulse_backup.log 2>&1
```

### Restore Procedure
```bash
# Decompress and restore PostgreSQL dump
gunzip -c /var/backups/gympulse/gympulse_prod_YYYYMMDD_HHMMSS.sql.gz | psql -U gympulse_user -d gympulse_prod
```

---

## 8. EXPO MOBILE PRODUCTION BUILDS

### EAS Build Profile (`apps/owner-mobile/eas.json` & `apps/member-mobile/eas.json`)
```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.gympulse.in/api/v1"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Commands
```bash
# Build Owner Mobile Android APK
cd apps/owner-mobile
eas build --platform android --profile production

# Build Member Mobile Android APK
cd apps/member-mobile
eas build --platform android --profile production
```

> [!IMPORTANT]
> Production mobile builds **MUST** be compiled with `EXPO_PUBLIC_API_URL=https://api.gympulse.in/api/v1`. `localhost`, `127.0.0.1`, and `10.0.2.2` must **NEVER** be used in production builds.

---

## 9. PRODUCTION VERIFICATION CHECKLIST

- [ ] **API Health Check**: `https://api.gympulse.in/api/v1/health` returns HTTP 200 `{ status: "ok" }`.
- [ ] **Database Connectivity**: API connects to PostgreSQL with `DATABASE_SSL=true`.
- [ ] **HTTPS Security**: Nginx forces TLS 1.3 and redirects HTTP to HTTPS.
- [ ] **CORS Verification**: Requests from `https://dashboard.gympulse.in` succeed; unauthorized origins blocked.
- [ ] **JWT Token Auth**: 7-day token issuance and authentication middleware operate cleanly.
- [ ] **3-Day Trial System**: New gym owner signup creates `subscription_status = 'TRIAL'`, `trial_started_at = NOW()`, `trial_ends_at = NOW() + INTERVAL '3 days'`.
- [ ] **Plan Entitlement Gating**: Trial allows Growth features; Pro features and Gym + Classes endpoints return HTTP 403 `FEATURE_LOCKED`.
- [ ] **Expired Trial Locking**: Expired trials lock product APIs (`HTTP 403 SUBSCRIPTION_REQUIRED`) while keeping `/subscription` accessible.
- [ ] **QR Code Pass Scanner**: Reception QR scanner checks in members and enforces single daily check-in rules.
- [ ] **Payment Recording & Receipts**: Fee recording generates formatted payment receipts and updates dashboard revenue metrics.
- [ ] **Tenant Isolation**: Multi-tenant database queries join strictly on authenticated `gym_id`.
- [ ] **Daily DB Backup**: Cron job `/opt/scripts/backup_gympulse_db.sh` runs and creates compressed archives.

---

## 10. PHYSICAL DEVICE TESTING REQUIREMENTS

Before deploying the app to the first real gym client:

1. **Physical Hardware Camera Testing**:
   - Install the production Android `.apk` on physical hardware (e.g. Xiaomi, Samsung, OnePlus).
   - Test hardware camera permission prompts and verify reception QR scanner performance under bright gym lighting and dim lighting.
2. **Cellular Connectivity Verification**:
   - Verify mobile app authentication, QR generation, and dashboard status cards over cellular 4G/5G networks (without local Wi-Fi / localhost).
3. **Digital Pass Display Verification**:
   - Test member mobile app digital QR pass on physical devices to ensure high-contrast QR display scans reliably at reception.
