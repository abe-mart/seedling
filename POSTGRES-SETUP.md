# PostgreSQL + Express Backend Setup

This guide walks you through setting up the Seedling app with PostgreSQL and a simple Express API on your Raspberry Pi.

## Architecture

```
Raspberry Pi
├── PostgreSQL Database (port 5432)
├── Express API Server (port 3006)
└── React Frontend (port 3005)
```

## Quick Setup on Raspberry Pi

###  1. Run Database Setup

```bash
cd ~/seedling
chmod +x setup-database.sh
./setup-database.sh
```

- Choose **option 2** (PostgreSQL only)
- Enter a secure password when prompted
- Save the password - you'll need it next

### 2. Set Up API Server

```bash
cd ~/seedling/api

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env
```

Edit the `.env` file:
```env
PORT=3006
DATABASE_URL=postgresql://seedling_user:YOUR_PASSWORD@localhost:5432/seedling
JWT_SECRET=your-super-secret-random-string-change-this
NODE_ENV=production
```

**Important:** Change `JWT_SECRET` to a random string! You can generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start API Server

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
```

### 4. Configure Frontend

```bash
cd ~/seedling

# Update .env
nano .env
```

Add:
```env
VITE_API_URL=http://localhost:3006
```

### 5. Build and Start Frontend

```bash
# Build
npm run build

# Start with PM2 (will prompt for port option)
./deploy-pi.sh
```

## Accessing the App

### From Raspberry Pi
- Frontend: `http://localhost:3005`
- API: `http://localhost:3006`

### From Network
- Frontend: `http://[pi-ip]:3005`
- API: `http://[pi-ip]:3006`

Find your Pi's IP:
```bash
hostname -I
```

## PM2 Management

### Check Status
```bash
pm2 status
```

You should see both apps running:
- `seedling` (frontend on port 3005)
- `seedling-api` (backend on port 3006)

### View Logs
```bash
# Frontend logs
pm2 logs seedling

# API logs
pm2 logs seedling-api

# Both
pm2 logs
```

### Restart Services
```bash
# Restart frontend
pm2 restart seedling

# Restart API
pm2 restart seedling-api

# Restart both
pm2 restart all
```

### Stop Services
```bash
pm2 stop seedling
pm2 stop seedling-api
```

## Firewall Configuration

If using `ufw`, allow the necessary ports:

```bash
# Allow API port
sudo ufw allow 3006/tcp

# Allow frontend port
sudo ufw allow 3005/tcp

# Check status
sudo ufw status
```

## Testing the Setup

### 1. Test API Health
```bash
curl http://localhost:3006/health
```

Should return:
```json
{"status":"ok","timestamp":"2025-10-17T..."}
```

### 2. Test Database Connection
```bash
psql -U seedling_user -d seedling -c "SELECT COUNT(*) FROM users;"
```

### 3. Test Frontend
Open browser to `http://[pi-ip]:3005`

## Updating the App

When you have new code:

```bash
cd ~/seedling

# Pull updates
git pull

# Update frontend dependencies if needed
npm install

# Update API dependencies if needed
cd api
npm install
cd ..

# Rebuild frontend
npm run build

# Restart services
pm2 restart all
```

## Troubleshooting

### API Won't Start

Check logs:
```bash
pm2 logs seedling-api --lines 50
```

Common issues:
- **Database connection failed**: Check `DATABASE_URL` in `api/.env`
- **Port 3006 in use**: Change PORT in `api/.env` and `api/ecosystem.config.cjs`

### Database Connection Errors

Test PostgreSQL:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U seedling_user -d seedling
```

### CORS Errors in Browser

The API allows all origins by default. If you need to restrict, edit `api/server.js`:
```javascript
app.use(cors({
  origin: 'http://your-pi-ip:3005'
}));
```

### Cannot Sign Up/Sign In

Check API logs and ensure:
1. Database migrations ran successfully
2. `users` table exists
3. JWT_SECRET is set in `api/.env`

## Security Recommendations

1. **Change JWT_SECRET** - Use a long random string
2. **Strong Database Password** - Use 16+ characters
3. **Firewall** - Only allow necessary ports
4. **HTTPS** - Use Nginx reverse proxy with Let's Encrypt
5. **Regular Updates** - Keep system and packages updated

## Using with Nginx (Optional)

To serve over port 80/443 with a domain:

```nginx
# /etc/nginx/sites-available/seedling
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3006/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then update frontend `.env`:
```env
VITE_API_URL=http://your-domain.com/api
```

## Backup Database

```bash
# Manual backup
cd ~/seedling
./backup.sh

# Or directly
sudo -u postgres pg_dump seedling > backup_$(date +%Y%m%d).sql
```

## Environment Variables Reference

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3006
```

### API (api/.env)
```env
PORT=3006
DATABASE_URL=postgresql://seedling_user:password@localhost:5432/seedling
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/signin` - Login
- `GET /auth/user` - Get current user (requires token)

### User Data
- `GET /profile` - Get user profile
- `PATCH /profile` - Update profile

### Resources (all require authentication)
- `GET /{table}` - List all items
- `GET /{table}/:id` - Get one item
- `POST /{table}` - Create item
- `PATCH /{table}/:id` - Update item
- `DELETE /{table}/:id` - Delete item

Tables: `series`, `books`, `story_elements`, `prompts`, `responses`, `user_settings`

## Complete!

Your app is now running entirely on your Raspberry Pi with:
- ✅ PostgreSQL database
- ✅ Express REST API
- ✅ JWT authentication
- ✅ React frontend
- ✅ PM2 process management

For questions, see the main [README.md](../README.md) or check PM2 logs.
