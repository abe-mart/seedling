# Seedling - AI Writing Prompt App

A React + TypeScript application for fiction writers to build their story worlds through personalized AI-powered prompts.

## Table of Contents
- [Overview](#overview)
- [Backend Options](#backend-options)
- [Prerequisites](#prerequisites)
- [Windows Development Setup](#windows-development-setup)
- [Raspberry Pi Production Setup](#raspberry-pi-production-setup)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

This application can be run in two configurations:
1. **Windows Development**: Local development with Vite dev server
2. **Raspberry Pi Production**: Production build served with PM2 and local PostgreSQL

## Backend Options

You can choose between two backend configurations:

### Option 1: Supabase Cloud (Recommended for Simplicity)
- ✅ Managed authentication
- ✅ Hosted database
- ✅ Free tier available
- ✅ Less setup required

**Documentation**: Use this README

### Option 2: PostgreSQL + Express (Full Local Control)
- ✅ Complete data ownership
- ✅ No cloud dependencies
- ✅ Custom API backend
- ✅ Runs entirely on your Pi

**Documentation**: See [POSTGRES-SETUP.md](POSTGRES-SETUP.md) for complete PostgreSQL setup

---

## Prerequisites (Supabase Cloud Setup)

### Windows (Development)
- Node.js 18+ (Download from [nodejs.org](https://nodejs.org/))
- npm or pnpm package manager
- Git for Windows
- VS Code (recommended)

### Raspberry Pi (Production)
- Raspberry Pi 3/4/5 running Raspberry Pi OS (64-bit recommended)
- Node.js 18+ 
- PostgreSQL 12+
- PM2 process manager
- Git

## Windows Development Setup

### 1. Install Dependencies

```powershell
# Clone the repository (if not already done)
git clone <repository-url>
cd seedling

# Install Node.js dependencies
npm install
```

### 2. Configure Environment

```powershell
# Copy the example environment file
Copy-Item .env.example .env

# Edit .env with your preferred editor
notepad .env
```

Set your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Setup (Supabase Cloud)

#### Option A: Use Supabase Cloud (Recommended for Development)

1. Go to [supabase.com](https://supabase.com/) and create a free account
2. Create a new project
3. Copy your project URL and anon key to `.env`
4. In Supabase Dashboard, go to SQL Editor
5. Run the migration file: `supabase/migrations/20251017235241_create_initial_schema.sql`

#### Option B: Use Local Supabase

```powershell
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase locally
supabase init

# Start local Supabase stack (requires Docker Desktop)
supabase start

# Apply migrations
supabase db reset
```

### 4. Run Development Server

```powershell
# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```powershell
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## Raspberry Pi Production Setup

### 1. Initial Raspberry Pi Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE seedling;
CREATE USER seedling_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE seedling TO seedling_user;
\c seedling
GRANT ALL ON SCHEMA public TO seedling_user;
EOF
```

### 3. Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pi --hp /home/pi
```

### 4. Clone and Setup Application

```bash
# Clone repository
cd ~
git clone <repository-url>
cd seedling

# Install dependencies
npm install

# Create logs directory for PM2
mkdir -p logs
```

### 5. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit environment file
nano .env
```

For Raspberry Pi with local PostgreSQL, configure Supabase to use your PostgreSQL:

**Option A: Use Supabase Self-Hosted (Recommended)**

Follow [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting) and configure:
```env
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your_generated_anon_key
```

**Option B: Use Supabase Cloud** (simpler but requires internet)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 6. Run Database Migrations

If using self-hosted Supabase:
```bash
# Apply migrations through Supabase
supabase db push
```

If using direct PostgreSQL access, run the SQL migration:
```bash
sudo -u postgres psql -d seedling -f supabase/migrations/20251017235241_create_initial_schema.sql
```

### 7. Build Application

```bash
# Build production bundle
npm run build
```

### 8. Start with PM2

```bash
# Option 1: Start on default port (3005)
npm run pm2:start

# Option 2: Automatically use next available port
npm run pm2:start:auto

# Or use the deployment script which will ask
chmod +x deploy-pi.sh
./deploy-pi.sh

# Save PM2 process list
pm2 save

# Check status
pm2 status
```

**Auto Port Selection**: The app can automatically find and use the next available port above 3005 if port 3005 is already in use. See [AUTO-PORT-GUIDE.md](AUTO-PORT-GUIDE.md) for details.


The application will now be running on `http://localhost:3000`

### 9. Access from Network

To access from other devices on your network:

```bash
# Find your Raspberry Pi's IP address
hostname -I

# Configure firewall (if ufw is enabled)
sudo ufw allow 3005/tcp

# If using auto-port, allow a range
sudo ufw allow 3005:3100/tcp
```

Access the app at `http://[raspberry-pi-ip]:3005` (or the port shown in the deployment output)

**Note**: If you used auto-port selection, check the deployment output or PM2 logs to see which port was assigned.

## Environment Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

The application requires these Supabase features:
- **Authentication**: Email/password authentication
- **Database**: PostgreSQL with RLS policies
- **Real-time** (optional): For live updates

## Deployment

### PM2 Commands

```bash
# Start application on default port (3005)
npm run pm2:start

# Start on next available port (auto-detect)
npm run pm2:start:auto

# Or use the start script directly
./start-on-available-port.sh        # Auto-detect from port 3005
./start-on-available-port.sh 5000   # Auto-detect from port 5000

# Stop application
npm run pm2:stop

# Restart application
npm run pm2:restart

# View logs
npm run pm2:logs

# Check status (shows which port is being used)
npm run pm2:status

# Or use PM2 directly
pm2 list
pm2 logs seedling
pm2 restart seedling
pm2 stop seedling
```

### Updating the Application

```bash
# On Raspberry Pi
cd ~/seedling

# Pull latest changes
git pull

# Install any new dependencies
npm install

# Rebuild application
npm run build

# Restart PM2
npm run pm2:restart
```

### Nginx Reverse Proxy (Optional)

For production with a domain name:

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/seedling
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/seedling /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Troubleshooting

### Windows Development

**Issue: Port 5173 already in use**
```powershell
# Find and kill process using port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

**Issue: Module not found errors**
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Raspberry Pi Production

**Issue: PM2 app crashes**
```bash
# Check logs
pm2 logs seedling --lines 100

# Check system resources
htop
free -h
df -h
```

**Issue: Out of memory**
```bash
# Increase swap space
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Issue: PostgreSQL connection refused**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

**Issue: Build fails on Raspberry Pi (limited memory)**
```bash
# Build with limited memory
NODE_OPTIONS="--max-old-space-size=512" npm run build
```

### Database Issues

**Issue: Migration fails**
```bash
# Check PostgreSQL connection
sudo -u postgres psql -d seedling -c "SELECT version();"

# Manually run migration
sudo -u postgres psql -d seedling < supabase/migrations/20251017235241_create_initial_schema.sql
```

**Issue: Permission denied**
```bash
# Grant permissions
sudo -u postgres psql -d seedling -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO seedling_user;"
sudo -u postgres psql -d seedling -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO seedling_user;"
```

## Performance Optimization

### Raspberry Pi 3/4 Optimization

```bash
# Adjust PM2 configuration for limited resources
# Edit ecosystem.config.cjs
nano ecosystem.config.cjs

# Reduce max memory restart threshold
# Change max_memory_restart: '500M' to '300M' if needed
```

### Build Optimization

For smaller bundle size:

```bash
# Analyze bundle
npm install -g vite-bundle-visualizer
npx vite-bundle-visualizer
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use strong PostgreSQL passwords** on Raspberry Pi
3. **Enable Raspberry Pi firewall** (ufw)
4. **Keep system updated**: `sudo apt update && sudo apt upgrade`
5. **Use HTTPS in production** (with Let's Encrypt + Nginx)
6. **Enable Row Level Security** in PostgreSQL/Supabase
7. **Regularly backup your database**

## Backup and Restore

### Database Backup

```bash
# Backup PostgreSQL database
sudo -u postgres pg_dump seedling > backup_$(date +%Y%m%d).sql

# Restore from backup
sudo -u postgres psql seedling < backup_20241017.sql
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## License

[Your License Here]

## Support

For issues and questions, please [open an issue](link-to-issues) on GitHub.
