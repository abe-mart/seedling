# StorySeed v2 - Quick Reference

## 🚀 Deployment & Management

### Deploy/Redeploy Application
```bash
cd /home/pi/seedling/v2
./deploy.sh
```

### Quick Restart (no rebuild)
```bash
./restart.sh
```

### Restart with Rebuild
```bash
./restart.sh --build
```

## 📊 Monitoring

### View Status
```bash
npm run pm2:status
# or
pm2 list
```

### View Logs (Live)
```bash
npm run pm2:logs
# or
pm2 logs seedling-v2
```

### View Last 100 Lines
```bash
pm2 logs seedling-v2 --lines 100
```

### Monitor Resources
```bash
pm2 monit
```

## 🎮 Control Commands

| Command | Description |
|---------|-------------|
| `npm run pm2:start` | Start the application |
| `npm run pm2:stop` | Stop the application |
| `npm run pm2:restart` | Restart the application |
| `npm run pm2:logs` | View live logs |
| `npm run pm2:status` | Check status |

## 🔍 Troubleshooting

### Check Application Health
```bash
curl http://localhost:3005/api/health
```

### View Error Logs Only
```bash
pm2 logs seedling-v2 --err --lines 50
```

### Restart if Stuck
```bash
pm2 restart seedling-v2
# or force restart
pm2 reload seedling-v2
```

### Clear Logs
```bash
pm2 flush seedling-v2
```

## 🌐 Access URLs

- **Local**: http://localhost:3005
- **Network**: http://0.0.0.0:3005
- **External**: http://[your-pi-ip]:3005

## 📁 Important Files

- **Config**: `/home/pi/seedling/v2/ecosystem.config.cjs`
- **Env**: `/home/pi/seedling/v2/.env`
- **Logs**: `/home/pi/seedling/v2/logs/`
- **Frontend**: `/home/pi/seedling/v2/dist/`
- **Backend**: `/home/pi/seedling/v2/backend/server.js`

## ⚙️ Auto-Start on Boot

PM2 configuration is already saved. The application will automatically restart on:
- System reboot
- Application crash
- High memory usage (>500MB)

To manually save PM2 state:
```bash
pm2 save
```

## 🔄 Update Process

1. Stop app: `pm2 stop seedling-v2`
2. Pull changes: `git pull`
3. Install deps: `npm install`
4. Build: `npm run build`
5. Start app: `pm2 start seedling-v2`

**Or simply run**: `./deploy.sh`

## 📝 NPM Scripts Available

- `npm run dev` - Development mode (Vite)
- `npm run dev:server` - Run server only
- `npm run build` - Build frontend
- `npm run start` - Build & run (no PM2)
- `npm run deploy` - Full deployment
- `npm run pm2:start` - Start with PM2
- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart PM2 process
- `npm run pm2:logs` - View logs
- `npm run pm2:status` - Check status
