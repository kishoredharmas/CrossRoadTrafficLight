# Deployment Guide

## Overview

This guide covers multiple deployment strategies for the Traffic Light Simulation application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Heroku Deployment](#heroku-deployment)
5. [Production Deployment](#production-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Docker** (optional): 20.x or higher
- **Docker Compose** (optional): 2.x or higher

### Recommended Hardware
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Stable internet connection

---

## Local Development

### 1. Clone Repository
```bash
git clone https://assets.engine.capgemini.com/KISSELVA/trafficlightsimulation.git
cd trafficlightsimulation
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 4. Start Development Server
```bash
# Start both server and client
npm run dev:full

# Or start separately:
# Server only (terminal 1)
npm run dev

# Client only (terminal 2)
npm run client
```

### 5. Access Application
- **Client**: http://localhost:3000
- **API**: http://localhost:3001
- **WebSocket**: ws://localhost:8080

---

## Docker Deployment

### Quick Start with Docker Compose

#### 1. Build and Run
```bash
docker-compose up --build
```

#### 2. Access Application
- **Application**: http://localhost:3001
- **WebSocket**: ws://localhost:8080

#### 3. Stop Services
```bash
# Stop with Ctrl+C, then:
docker-compose down

# Remove volumes (database):
docker-compose down -v
```

### Manual Docker Build

#### 1. Build Image
```bash
docker build -t traffic-sim:latest .
```

#### 2. Run Container
```bash
docker run -d \
  -p 3001:3001 \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  --name traffic-sim \
  traffic-sim:latest
```

#### 3. View Logs
```bash
docker logs -f traffic-sim
```

#### 4. Stop Container
```bash
docker stop traffic-sim
docker rm traffic-sim
```

### Docker Configuration

**Dockerfile Optimization**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install --production
RUN cd client && npm install --production

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Create data directories
RUN mkdir -p data/sessions data/recordings

EXPOSE 3001 8080

CMD ["npm", "start"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3001
      - WS_PORT=8080
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## Heroku Deployment

### 1. Prerequisites
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login
```

### 2. Create Heroku App
```bash
# Create new app
heroku create traffic-light-sim

# Or use existing app
heroku git:remote -a your-app-name
```

### 3. Configure Buildpacks
```bash
# Add Node.js buildpack
heroku buildpacks:set heroku/nodejs
```

### 4. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set NPM_CONFIG_PRODUCTION=false
heroku config:set PORT=3001
heroku config:set WS_PORT=8080
```

### 5. Deploy Application
```bash
# Push to Heroku
git push heroku main

# Or from feature branch
git push heroku feature/branch-name:main
```

### 6. Scale Dynos
```bash
# Scale web dyno
heroku ps:scale web=1

# Check dyno status
heroku ps
```

### 7. View Logs
```bash
# Tail logs
heroku logs --tail

# View recent logs
heroku logs -n 100
```

### 8. Open Application
```bash
heroku open
```

### Heroku Configuration Files

**Procfile**:
```
web: npm start
```

**package.json scripts**:
```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "cd client && npm install && npm run build",
    "heroku-postbuild": "npm run build"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

---

## Production Deployment

### Architecture Overview

```
Internet
    ↓
Reverse Proxy (nginx)
    ↓
Load Balancer (optional)
    ↓
Application Server(s)
    ↓
Database (SQLite/PostgreSQL)
```

### 1. Server Setup (Ubuntu 22.04)

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Install nginx
```bash
sudo apt install -y nginx
```

#### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 2. Deploy Application

#### Clone Repository
```bash
cd /var/www
sudo git clone https://your-repo-url.git traffic-sim
cd traffic-sim
```

#### Install Dependencies
```bash
sudo npm install --production
cd client
sudo npm install --production
cd ..
```

#### Build Client
```bash
export NODE_OPTIONS="--max-old-space-size=2048"
cd client
npm run build
cd ..
```

#### Configure Environment
```bash
sudo nano .env
```

```env
NODE_ENV=production
PORT=3001
WS_PORT=8080
DB_PATH=./data/traffic_simulation.db
```

### 3. Configure PM2

#### Create Ecosystem File
```bash
sudo nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'traffic-sim',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      WS_PORT: 8080
    },
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
```

#### Start Application
```bash
# Create logs directory
sudo mkdir -p logs

# Start with PM2
sudo pm2 start ecosystem.config.js

# Save PM2 configuration
sudo pm2 save

# Setup PM2 to start on boot
sudo pm2 startup systemd
```

#### PM2 Commands
```bash
# Status
sudo pm2 status

# Logs
sudo pm2 logs traffic-sim

# Restart
sudo pm2 restart traffic-sim

# Stop
sudo pm2 stop traffic-sim

# Delete
sudo pm2 delete traffic-sim
```

### 4. Configure nginx

#### Create nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/traffic-sim
```

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/traffic-sim-access.log;
    error_log /var/log/nginx/traffic-sim-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # API and static files
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/traffic-sim /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### 6. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Environment Configuration

### Environment Variables

**.env Example**:
```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3001
WS_PORT=8080
HOST=0.0.0.0

# Database
DB_PATH=./data/traffic_simulation.db

# Logging
LOG_LEVEL=info

# CORS (comma-separated origins)
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Session Configuration
SESSION_SECRET=your-secret-key-here

# Map API Keys (optional)
GOOGLE_MAPS_API_KEY=your-api-key
OSM_API_KEY=your-api-key
```

### Client Configuration

**client/.env.production**:
```env
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_WS_URL=wss://your-domain.com/ws
REACT_APP_GOOGLE_MAPS_KEY=your-api-key
```

---

## Monitoring & Maintenance

### Application Monitoring

#### PM2 Monitoring
```bash
# Dashboard
sudo pm2 monit

# Web dashboard
sudo pm2 web
```

#### Custom Health Check
Create endpoint in `server/index.js`:
```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});
```

#### Monitor Script
```bash
#!/bin/bash
# health-check.sh

ENDPOINT="http://localhost:3001/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ $RESPONSE -eq 200 ]; then
    echo "✓ Application is healthy"
    exit 0
else
    echo "✗ Application is down (HTTP $RESPONSE)"
    sudo pm2 restart traffic-sim
    exit 1
fi
```

### Database Backup

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/var/backups/traffic-sim"
DB_PATH="/var/www/traffic-sim/data/traffic_simulation.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/traffic_sim_$TIMESTAMP.db"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.db" -mtime +30 -delete

echo "Backup completed: traffic_sim_$TIMESTAMP.db"
```

#### Schedule Backups (crontab)
```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/traffic-sim/backup-db.sh >> /var/log/traffic-sim-backup.log 2>&1
```

### Log Rotation

**Create logrotate config**:
```bash
sudo nano /etc/logrotate.d/traffic-sim
```

```
/var/www/traffic-sim/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        sudo pm2 reloadLogs
    endscript
}
```

---

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Check logs**:
```bash
sudo pm2 logs traffic-sim --lines 100
```

**Check port availability**:
```bash
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :8080
```

**Solution**:
```bash
# Kill process on port
sudo kill -9 $(sudo lsof -t -i:3001)

# Restart application
sudo pm2 restart traffic-sim
```

#### 2. Database Connection Error

**Check file permissions**:
```bash
ls -la data/traffic_simulation.db
```

**Fix permissions**:
```bash
sudo chown -R $USER:$USER data/
chmod 664 data/traffic_simulation.db
```

#### 3. Out of Memory Error

**Increase Node memory**:
```bash
# In ecosystem.config.js
node_args: '--max-old-space-size=2048'
```

**Restart application**:
```bash
sudo pm2 restart traffic-sim
```

#### 4. WebSocket Connection Failed

**Check nginx WebSocket configuration**:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Check firewall**:
```bash
sudo ufw allow 8080/tcp
```

#### 5. SSL Certificate Error

**Renew certificate**:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Performance Optimization

#### 1. Enable Caching
```javascript
// In server/index.js
app.use(express.static('client/build', {
  maxAge: '1y',
  etag: true
}));
```

#### 2. Enable Compression
```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

#### 3. Database Optimization
```javascript
// Add database indexes
await queryInterface.addIndex('sessions', ['status', 'createdAt']);
```

---

## Continuous Deployment

### GitLab CI/CD Auto-Deploy

**.gitlab-ci.yml**:
```yaml
deploy:
  stage: deploy
  only:
    - main
  script:
    - ssh user@your-server.com "cd /var/www/traffic-sim && git pull && npm install --production && cd client && npm install --production && npm run build && cd .. && sudo pm2 restart traffic-sim"
```

### Automated Deployment Script

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm install --production
cd client
npm install --production

# Build client
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
cd ..

# Restart application
sudo pm2 restart traffic-sim

echo "✅ Deployment completed!"
```

---

## Security Checklist

- [ ] Use HTTPS/WSS in production
- [ ] Set strong `SESSION_SECRET`
- [ ] Configure CORS properly
- [ ] Keep dependencies updated
- [ ] Enable firewall
- [ ] Use non-root user
- [ ] Implement rate limiting
- [ ] Enable security headers
- [ ] Regular security audits
- [ ] Automated backups
- [ ] Monitor logs for suspicious activity

---

## Support

For issues or questions:
- Check logs: `sudo pm2 logs traffic-sim`
- Review documentation
- Check GitLab issues
- Contact development team

---

## References

- [Node.js Deployment](https://nodejs.org/en/docs/guides/getting-started-guide/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/getting-started/)
- [Docker Documentation](https://docs.docker.com/)
- [Heroku Documentation](https://devcenter.heroku.com/)
