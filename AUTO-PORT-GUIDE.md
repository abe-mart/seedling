# Auto Port Selection Guide

This guide explains how to automatically deploy on the next available port.

## Overview

By default, the app deploys on port 3005. If that port is already in use, you can now automatically find and use the next available port.

## How It Works

1. **Port Scanner** (`find-port.js`) - Checks ports starting from 3005 to find an available one
2. **Auto-start Script** (`start-on-available-port.sh`) - Launches the app on the found port
3. **Deploy Script** - Now asks if you want to use auto-port selection

## Usage

### Option 1: Automatic (Recommended)

When you run the deploy script, it will ask:

```bash
./deploy-pi.sh
```

You'll see:
```
Start on next available port? (y/n, default=n):
```

- Type `y` to automatically find and use the next available port
- Type `n` (or press Enter) to use port 3005

### Option 2: Direct Script

Run the auto-port script directly:

```bash
# Find and use next available port starting from 3005
./start-on-available-port.sh

# Or start from a different port
./start-on-available-port.sh 5000
```

### Option 3: NPM Script

Use the npm script:

```bash
npm run pm2:start:auto
```

### Option 4: Manual Port Selection

Start on a specific port using PM2 directly:

```bash
PORT=3001 pm2 start npx --name seedling -- serve -s dist -l 3001
pm2 save
```

## Examples

### Example 1: Port 3005 is in use

```bash
./start-on-available-port.sh
```

Output:
```
🔍 Finding available port starting from 3005...
✅ Found available port: 3006
🚀 Starting Seedling on port 3006...
✅ Seedling is now running on port 3006

Access the app at:
  Local: http://localhost:3006
  Network: http://192.168.1.100:3006
```

### Example 2: Start from port 5000

```bash
./start-on-available-port.sh 5000
```

This will find the first available port starting from 5000.

### Example 3: Check which port is being used

```bash
pm2 status
```

Or check the logs:
```bash
pm2 logs seedling --lines 5
```

## Finding Currently Used Port

If the app is already running and you forgot which port:

```bash
# Method 1: Check PM2 status
pm2 status

# Method 2: Check environment variable
pm2 env seedling | grep PORT

# Method 3: Check listening ports
sudo netstat -tlnp | grep node
# or
sudo ss -tlnp | grep node

# Method 4: Check logs
pm2 logs seedling --lines 10
```

## Changing Port After Deployment

To change the port after the app is running:

```bash
# Stop current instance
pm2 stop seedling

# Start on new port (automatic)
./start-on-available-port.sh

# Or start on specific port
PORT=4000 pm2 start npx --name seedling -- serve -s dist -l 4000
pm2 save
```

## Advanced: Windows Development with Auto-Port

For Windows development, you can use a similar approach:

```powershell
# Install the serve package globally first
npm install -g serve

# Find and use next available port
$port = node find-port.js 3005
serve -s dist -l $port
```

Or add to `package.json`:
```json
"serve:auto": "node find-port.js 3005 | xargs -I {} serve -s dist -l {}"
```

## Troubleshooting

### Issue: "Cannot find module 'net'"

This shouldn't happen as `net` is a Node.js core module, but if it does:
```bash
node --version  # Ensure Node.js is installed
```

### Issue: Script hangs when checking ports

The script has a 100-port limit. If all ports are in use:
```bash
# Check what's using ports
sudo netstat -tlnp | grep :300
# or
sudo ss -tlnp | grep :300

# Kill specific processes if needed
pm2 delete all  # Be careful with this!
```

### Issue: Permission denied on port < 1024

Ports below 1024 require root privileges:
```bash
# Don't start from port 80 or 443 without sudo
./start-on-available-port.sh 80  # This will fail

# Use port 3000+ or configure with Nginx
```

### Issue: Port found but app won't start

Check if firewall is blocking:
```bash
sudo ufw status
sudo ufw allow [port]/tcp
```

## Best Practices

1. **Use auto-port for development** - Prevents conflicts when testing
2. **Use fixed port for production** - Easier to configure reverse proxy (port 3005)
3. **Document the port** - Save which port you're using in your notes
4. **Use Nginx reverse proxy** - Map port 80/443 to your app's port
5. **Check logs** - Always verify the app started on the expected port

## Integration with Nginx

If using Nginx reverse proxy, update your config when port changes:

```nginx
# /etc/nginx/sites-available/seedling
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3005;  # Update this port if changed
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Scripts Summary

| Script | Purpose | Usage |
|--------|---------|-------|
| `find-port.js` | Find available port | `node find-port.js 3005` |
| `start-on-available-port.sh` | Auto-start on available port | `./start-on-available-port.sh` |
| `deploy-pi.sh` | Deploy with optional auto-port | `./deploy-pi.sh` |
| `npm run pm2:start:auto` | NPM shortcut for auto-port | `npm run pm2:start:auto` |
| `npm run pm2:start` | Start on default port (3005) | `npm run pm2:start` |

## See Also

- [README.md](README.md) - Main documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [deploy-pi.sh](deploy-pi.sh) - Deployment script
