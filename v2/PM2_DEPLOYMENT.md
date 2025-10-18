# StorySeed v2 - PM2 Deployment Guide

## Quick Start

### Deploy the application
```bash
cd /home/pi/seedling/v2
npm run deploy
# or
./deploy.sh
```

### Restart the application
```bash
npm run pm2:restart
# or
./restart.sh
```

### Restart with rebuild
```bash
./restart.sh --build
```

## PM2 Commands

### Start application
```bash
npm run pm2:start
# or
pm2 start ecosystem.config.cjs
```

### Stop application
```bash
npm run pm2:stop
# or
pm2 stop seedling-v2
```

### Restart application
```bash
npm run pm2:restart
# or
pm2 restart seedling-v2
```

### View logs
```bash
npm run pm2:logs
# or
pm2 logs seedling-v2

# View last 50 lines
pm2 logs seedling-v2 --lines 50

# View only errors
pm2 logs seedling-v2 --err
```

### Check status
```bash
npm run pm2:status
# or
pm2 status
```

### Monitor in real-time
```bash
pm2 monit
```

## Setup PM2 to Start on Boot

### Save current PM2 configuration
```bash
pm2 save
```

### Setup startup script
```bash
pm2 startup
# Follow the instructions to run the command with sudo
```

### Remove from startup
```bash
pm2 unstartup systemd
```

## Troubleshooting

### Application won't start
1. Check logs: `pm2 logs seedling-v2 --lines 100`
2. Check if port 3005 is available: `lsof -i :3005`
3. Verify database is running: `systemctl status postgresql`
4. Check environment variables in `.env`

### High memory usage
- The ecosystem.config.cjs is set to restart if memory exceeds 500MB
- Adjust `max_memory_restart` if needed

### Database connection issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env file
- Check database credentials

## Log Files

Logs are stored in `/home/pi/seedling/v2/logs/`:
- `error.log` - Error logs only
- `out.log` - Standard output logs
- `combined.log` - All logs combined

## Environment

The application runs with:
- Node.js production mode
- Port: 3005 (or from .env PORT variable)
- Built frontend served from `dist/`

## Updating the Application

1. Stop the application: `npm run pm2:stop`
2. Pull changes: `git pull`
3. Install dependencies: `npm install`
4. Build frontend: `npm run build`
5. Start application: `npm run pm2:start`

Or simply run: `./deploy.sh`

## Accessing the Application

- **Local**: http://localhost:3005
- **Network**: http://[your-pi-ip]:3005

Make sure port 3005 is open in your firewall if accessing from other devices.
