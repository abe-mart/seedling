# PostgreSQL Backend Setup - Summary

## ✅ What Was Created

### Backend API (`/api` directory)
- **`api/server.js`** - Express server with REST API
  - JWT authentication
  - User registration/login
  - CRUD endpoints for all tables
  - PostgreSQL connection

- **`api/package.json`** - API dependencies
  - express
  - pg (PostgreSQL client)
  - bcrypt (password hashing)
  - jsonwebtoken (JWT tokens)
  - cors, dotenv

- **`api/ecosystem.config.cjs`** - PM2 config for API
  - Runs on port 3006
  - Auto-restart enabled
  - Log management

- **`api/.env.example`** - API environment template

### Frontend Changes
- **`src/lib/api.ts`** - API client for PostgreSQL backend
  - Replaces Supabase client
  - JWT token management
  - REST API methods

- **`src/contexts/AuthContext.tsx`** - Updated auth context
  - Uses new API client
  - Local authentication flow
  - No Supabase dependencies

### Database
- **`supabase/migrations/20251017235241_postgres_only.sql`** - PostgreSQL-only schema
  - No Supabase auth schema
  - Local `users` table
  - All app tables included
  - Triggers and indexes

### Setup Scripts
- **`setup-database.sh`** - Updated to offer PostgreSQL option
- **`deploy-pi.sh`** - Updated to handle API deployment

### Documentation
- **`POSTGRES-SETUP.md`** - Complete PostgreSQL setup guide

## 🚀 How to Deploy on Raspberry Pi

### 1. Set Up Database
```bash
cd ~/seedling
./setup-database.sh
# Choose option 2 (PostgreSQL only)
# Save the password!
```

### 2. Configure API
```bash
cd api
npm install
cp .env.example .env
nano .env
```

Edit `.env`:
```env
PORT=3006
DATABASE_URL=postgresql://seedling_user:YOUR_PASSWORD@localhost:5432/seedling
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NODE_ENV=production
```

### 3. Configure Frontend
```bash
cd ~/seedling
nano .env
```

Add:
```env
VITE_API_URL=http://localhost:3006
```

### 4. Deploy Everything
```bash
./deploy-pi.sh
```

This will:
- Install all dependencies (frontend + API)
- Build frontend
- Start API with PM2
- Start frontend with PM2

## 🔍 Check Status

```bash
pm2 status
```

You should see:
- `seedling-api` - Running on port 3006
- `seedling` - Running on port 3005

## 📍 Access URLs

- **Frontend**: `http://[pi-ip]:3005`
- **API**: `http://[pi-ip]:3006`
- **API Health**: `http://[pi-ip]:3006/health`

## 🛠️ Management

### View Logs
```bash
pm2 logs seedling        # Frontend
pm2 logs seedling-api    # API
pm2 logs                 # Both
```

### Restart
```bash
pm2 restart seedling
pm2 restart seedling-api
```

### Stop
```bash
pm2 stop seedling
pm2 stop seedling-api
```

## 📝 Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3006
```

### API (`api/.env`)
```env
PORT=3006
DATABASE_URL=postgresql://seedling_user:password@localhost:5432/seedling
JWT_SECRET=your-random-secret-key
NODE_ENV=production
```

## 🔒 Security

1. **JWT_SECRET** - Use a strong random value
2. **Database Password** - Strong and unique
3. **Firewall** - Allow only necessary ports:
   ```bash
   sudo ufw allow 3005/tcp  # Frontend
   sudo ufw allow 3006/tcp  # API
   ```

## 🎯 Features

- ✅ **Full local control** - No cloud dependencies
- ✅ **JWT authentication** - Secure token-based auth
- ✅ **Password hashing** - bcrypt protection
- ✅ **RESTful API** - Standard HTTP endpoints
- ✅ **PostgreSQL** - Reliable local database
- ✅ **PM2 management** - Auto-restart and monitoring

## 📚 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login
- `GET /auth/user` - Get current user

### User Profile
- `GET /profile` - Get profile
- `PATCH /profile` - Update profile

### Data (all require JWT token)
- `GET /series`, `POST /series`, etc.
- `GET /books`, `POST /books`, etc.
- `GET /story_elements`, etc.
- `GET /prompts`, etc.
- `GET /responses`, etc.

## 🔄 Development Workflow

### Update Code
```bash
git pull
cd api && npm install && cd ..
npm install
npm run build
pm2 restart all
```

### Database Changes
```bash
# Add new migration
sudo -u postgres psql -d seedling -f new_migration.sql
```

### Test API
```bash
curl http://localhost:3006/health
```

## ✨ Complete Setup

Your Raspberry Pi now runs:
1. **PostgreSQL** - Database on port 5432
2. **Express API** - Backend on port 3006
3. **React App** - Frontend on port 3005

All managed by PM2 with automatic restarts!

For detailed instructions, see [POSTGRES-SETUP.md](POSTGRES-SETUP.md)
