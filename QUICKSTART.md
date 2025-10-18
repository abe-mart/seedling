# Quick Start Guide

Choose your platform:

## 🪟 Windows (Development)

### Quick Setup
1. **Install Node.js 18+** from [nodejs.org](https://nodejs.org/)
2. **Open PowerShell** in the project directory
3. **Run setup script**:
   ```powershell
   .\setup-windows.ps1
   ```
4. **Configure Supabase**:
   - Create account at [supabase.com](https://supabase.com/)
   - Create new project
   - Edit `.env` with your credentials:
     ```env
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=your_key_here
     ```
5. **Apply migrations** in Supabase SQL Editor (copy/paste contents of `supabase/migrations/20251017235241_create_initial_schema.sql`)
6. **Start development**:
   ```powershell
   npm run dev
   ```
7. **Open browser** to `http://localhost:5173`

### Manual Setup
```powershell
# Install dependencies
npm install

# Copy environment file
Copy-Item .env.example .env

# Edit .env file
notepad .env

# Start development server
npm run dev
```

---

## 🥧 Raspberry Pi (Production)

### Prerequisites
- Raspberry Pi 3/4/5 with Raspberry Pi OS
- SSH access enabled
- Internet connection

### Quick Setup
1. **SSH into your Raspberry Pi**:
   ```bash
   ssh pi@raspberrypi.local
   ```

2. **Install Node.js 18+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs git
   ```

3. **Clone repository**:
   ```bash
   git clone <your-repo-url>
   cd seedling
   ```

4. **Run database setup**:
   ```bash
   chmod +x setup-database.sh
   ./setup-database.sh
   ```
   - Follow prompts to create PostgreSQL database
   - Save the connection string provided

5. **Configure environment**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   - Add your Supabase credentials (can use Supabase Cloud or self-hosted)

6. **Deploy application**:
   ```bash
   chmod +x deploy-pi.sh
   ./deploy-pi.sh
   ```
   - Script will ask if you want auto-port selection
   - Choose 'y' to use next available port, or 'n' for port 3005

7. **Access your app**:
   - Find your Pi's IP: `hostname -I`
   - Open browser to `http://[pi-ip]:3005`
   - (Check deployment output for actual port if using auto-port)

### Manual Setup
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
npm run pm2:start

# Save PM2 process
pm2 save

# Enable PM2 on boot
pm2 startup
```

---

## 🔧 Common Commands

### Development (Windows)
```powershell
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
npm run typecheck    # Check TypeScript types
```

### Production (Raspberry Pi)
```bash
npm run pm2:start         # Start on port 3005
npm run pm2:start:auto    # Start on next available port
npm run pm2:stop          # Stop application
npm run pm2:restart       # Restart application
npm run pm2:logs          # View logs
npm run pm2:status        # Check status (shows port)

# Auto-port scripts
./start-on-available-port.sh       # Find and use next available port (from 3005)
./start-on-available-port.sh 5000  # Start searching from port 5000

# Update application
git pull
npm install
npm run build
npm run pm2:restart
```

---

## 🚨 Troubleshooting

### Windows
- **Port in use**: Close other applications using port 5173
- **Module not found**: Delete `node_modules` and run `npm install`
- **Build fails**: Clear npm cache: `npm cache clean --force`

### Raspberry Pi
- **Out of memory during build**: 
  ```bash
  NODE_OPTIONS="--max-old-space-size=512" npm run build
  ```
- **PM2 app not starting**: Check logs with `pm2 logs seedling`
- **Database connection error**: Verify PostgreSQL is running: `sudo systemctl status postgresql`

---

## 📚 Full Documentation

See [README.md](README.md) for complete setup instructions, configuration options, and advanced topics.

---

## 🆘 Need Help?

1. Check the [README.md](README.md) troubleshooting section
2. Review PM2 logs: `pm2 logs seedling`
3. Check application logs in `logs/` directory
4. Open an issue on GitHub

---

## 🔐 Security Checklist

- [ ] Never commit `.env` files
- [ ] Use strong database passwords
- [ ] Enable firewall on Raspberry Pi
- [ ] Keep system packages updated
- [ ] Use HTTPS in production (with Nginx + Let's Encrypt)
- [ ] Enable Row Level Security in Supabase
- [ ] Regular database backups
