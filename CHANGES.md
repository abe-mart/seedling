# Changes Summary

This document outlines all changes made to enable deployment on Raspberry Pi with PM2 and local development on Windows.

## Files Modified

### 1. `package.json`
**Changes:**
- Added `serve` package to devDependencies for serving production builds
- Added PM2 management scripts:
  - `serve`: Serve production build on port 3000
  - `pm2:start`: Start application with PM2
  - `pm2:stop`: Stop PM2 process
  - `pm2:restart`: Restart PM2 process
  - `pm2:logs`: View PM2 logs
  - `pm2:status`: Check PM2 status

### 2. `vite.config.ts`
**Changes:**
- Added `server.host: '0.0.0.0'` to allow external connections (for network access)
- Added `server.port: 5173` (explicit port configuration)
- Added `preview.host: '0.0.0.0'` for preview server
- Added `preview.port: 4173` for preview server

### 3. `.gitignore`
**Changes:**
- Added environment variable files to ignore list
- Added PM2 log files to ignore list
- Added logs directory to ignore list

## Files Created

### Configuration Files

1. **`.env.example`**
   - Template for environment variables
   - Includes Supabase configuration placeholders
   - Safe to commit to repository

2. **`ecosystem.config.cjs`**
   - PM2 process manager configuration
   - Configures app name, start command, memory limits
   - Sets up logging to `logs/` directory
   - Single instance configuration suitable for Raspberry Pi

3. **`seedling.service`**
   - Systemd service file (alternative to PM2)
   - For users who prefer systemd over PM2

### Documentation

4. **`README.md`**
   - Comprehensive setup guide for both platforms
   - Windows development setup instructions
   - Raspberry Pi production setup instructions
   - Database configuration (PostgreSQL + Supabase)
   - PM2 deployment instructions
   - Troubleshooting guide
   - Security considerations
   - Backup and restore procedures

5. **`QUICKSTART.md`**
   - Quick reference guide
   - Platform-specific quick start commands
   - Common troubleshooting steps
   - Security checklist

6. **`DEPLOYMENT-CHECKLIST.md`**
   - Step-by-step deployment checklist
   - Pre-deployment requirements
   - Post-deployment verification
   - Maintenance schedule
   - Rollback procedures

### Scripts

7. **`setup-windows.ps1`** (PowerShell)
   - Automated Windows development setup
   - Checks Node.js installation
   - Installs dependencies
   - Creates .env file
   - Runs type checking and build test

8. **`deploy-pi.sh`** (Bash)
   - Automated Raspberry Pi deployment script
   - Checks system requirements
   - Installs dependencies
   - Builds application
   - Starts/restarts PM2 process
   - Handles limited memory scenarios

9. **`setup-database.sh`** (Bash)
   - Automated PostgreSQL setup for Raspberry Pi
   - Creates database and user
   - Sets proper permissions
   - Applies migrations
   - Provides connection string

## Architecture Changes

### Development (Windows)
```
Windows PC
├── Vite Dev Server (port 5173)
├── React + TypeScript
└── Supabase Cloud (or local)
```

**Workflow:**
1. Edit code in VS Code
2. Vite hot-reloads changes
3. Connect to Supabase (cloud or local)
4. Test features locally

### Production (Raspberry Pi)
```
Raspberry Pi
├── PostgreSQL Database
├── PM2 Process Manager
│   └── Node.js + serve
│       └── Static React Build (port 3000)
└── Optional: Nginx Reverse Proxy (port 80/443)
```

**Workflow:**
1. Build production bundle on Pi (or transfer pre-built)
2. PM2 serves static files
3. React app connects to Supabase
4. PostgreSQL provides data storage

## Key Features

### Cross-Platform Support
- ✅ Windows development with hot-reload
- ✅ Raspberry Pi production deployment
- ✅ Network access from other devices
- ✅ Environment-specific configuration

### Process Management
- ✅ PM2 for automatic restart on crash
- ✅ PM2 startup on system boot
- ✅ Centralized logging
- ✅ Memory limit protection

### Database Options
- ✅ Supabase Cloud (easiest for development)
- ✅ Local Supabase (full-stack local development)
- ✅ PostgreSQL + Supabase self-hosted (Raspberry Pi)
- ✅ Direct PostgreSQL connection (advanced)

### Developer Experience
- ✅ Automated setup scripts
- ✅ Clear documentation
- ✅ Troubleshooting guides
- ✅ Deployment checklists

## Migration Path

### For Existing Users

If you already have this project set up:

1. **Pull the latest changes**:
   ```bash
   git pull
   ```

2. **Install new dependencies**:
   ```bash
   npm install
   ```

3. **Create .env file**:
   ```bash
   # Windows
   Copy-Item .env.example .env
   
   # Linux/Mac
   cp .env.example .env
   ```

4. **Add your Supabase credentials** to `.env`

5. **Test the build**:
   ```bash
   npm run build
   ```

### For New Users

Follow the instructions in [QUICKSTART.md](QUICKSTART.md) for your platform.

## Environment Variables

### Required Variables
```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Platform-Specific
- **Windows**: Typically uses Supabase Cloud
- **Raspberry Pi**: Can use Supabase Cloud or self-hosted

## Performance Considerations

### Raspberry Pi Optimization
- Build process may require reduced memory limit
- PM2 configured with 500MB max memory
- Single instance (not clustered) to conserve resources
- Logs automatically managed by PM2

### Build Size
- Production build is optimized by Vite
- Code splitting enabled
- Static assets compressed
- Typical bundle size: ~500KB (gzipped)

## Security Enhancements

1. **Environment Variables**: Never committed to git
2. **PostgreSQL**: Not exposed to public internet by default
3. **Supabase RLS**: Row Level Security policies in migrations
4. **PM2**: Runs as non-root user
5. **Systemd**: Additional security settings in service file

## Next Steps

### Immediate
1. Run setup script for your platform
2. Configure Supabase credentials
3. Apply database migrations
4. Test application locally

### Optional Enhancements
1. Set up Nginx reverse proxy
2. Configure SSL/TLS with Let's Encrypt
3. Set up automated backups
4. Configure monitoring/alerting
5. Set up CI/CD pipeline

## Support

For questions or issues:
1. Check [README.md](README.md) troubleshooting section
2. Review [QUICKSTART.md](QUICKSTART.md)
3. Check application/PM2 logs
4. Open GitHub issue

## Rollback

If you need to revert these changes:
```bash
git checkout <previous-commit-hash>
npm install
```

Note: You may need to manually remove new files created by scripts.
