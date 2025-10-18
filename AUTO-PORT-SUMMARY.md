# Auto-Port Feature Summary

## ✅ What Was Added

I've added automatic port detection functionality so your app can deploy on the next available port above 3000 if the default port is in use.

## 📝 New Files Created

1. **`find-port.js`** - Node.js script that scans for available ports
   - Checks ports sequentially starting from a given number
   - Returns the first available port
   - Handles up to 100 port attempts

2. **`start-on-available-port.sh`** - Bash script for auto-port deployment
   - Uses `find-port.js` to find an available port
   - Starts the app with PM2 on that port
   - Displays the actual port being used
   - Saves PM2 configuration

3. **`AUTO-PORT-GUIDE.md`** - Complete documentation for auto-port feature
   - Usage examples
   - Troubleshooting tips
   - Integration with Nginx
   - Best practices

## 🔄 Modified Files

1. **`ecosystem.config.cjs`** - Updated PM2 config
   - Added PORT environment variable
   - More explicit port binding

2. **`package.json`** - Added new scripts
   - `serve:auto` - Serve with auto-port detection
   - `pm2:start:auto` - Start PM2 with auto-port

3. **`deploy-pi.sh`** - Enhanced deployment script
   - Now asks if you want auto-port selection
   - Calls auto-port script when selected
   - Shows actual port in output

4. **`README.md`** - Updated main documentation
   - Added auto-port instructions
   - Updated PM2 commands section
   - Added firewall port range example

5. **`QUICKSTART.md`** - Updated quick reference
   - Added auto-port commands
   - Updated deployment instructions

## 🚀 How to Use

### Method 1: During Deployment (Recommended)

```bash
./deploy-pi.sh
```

When prompted:
```
Start on next available port? (y/n, default=n):
```
- Type **`y`** to use auto-port
- Type **`n`** or press Enter for default port 3000

### Method 2: Direct Script

```bash
# Use next available port from 3000
./start-on-available-port.sh

# Or start from a different port
./start-on-available-port.sh 5000
```

### Method 3: NPM Script

```bash
npm run pm2:start:auto
```

### Method 4: Manual Port

```bash
# Traditional way - fixed port
npm run pm2:start
```

## 📊 Example Output

```bash
$ ./start-on-available-port.sh

🔍 Finding available port starting from 3005...
✅ Found available port: 3006
🚀 Starting Seedling on port 3006...
✅ Seedling is now running on port 3006

Access the app at:
  Local: http://localhost:3006
  Network: http://192.168.1.100:3006

Useful commands:
  pm2 logs seedling    - View logs
  pm2 restart seedling - Restart app
  pm2 stop seedling    - Stop app
```

## 🔍 Finding Current Port

If you forget which port the app is running on:

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs seedling --lines 5

# Check listening ports
sudo netstat -tlnp | grep node
```

## 🛡️ Firewall Configuration

If using auto-port, allow a range of ports:

```bash
# Allow ports 3000-3100
sudo ufw allow 3000:3100/tcp

# Or allow specific port after deployment
sudo ufw allow 3001/tcp
```

## 🌐 Nginx Integration

Update your Nginx config with the actual port:

```nginx
location / {
    proxy_pass http://localhost:3001;  # Use actual port
    # ... rest of config
}
```

Then reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Use Cases

### Use Case 1: Development/Testing
You're testing multiple versions of the app:
```bash
# Version 1 on port 3005
npm run pm2:start

# Version 2 auto-finds port 3006
./start-on-available-port.sh
```

### Use Case 2: Port Conflict
Port 3005 is used by another service:
```bash
# Automatically uses port 3006
./start-on-available-port.sh
```

### Use Case 3: Specific Port Range
You want to use ports in the 5000 range:
```bash
./start-on-available-port.sh 5000
```

## 📋 Quick Reference

| Command | Port Behavior | When to Use |
|---------|--------------|-------------|
| `npm run pm2:start` | Fixed (3005) | Production, stable setup |
| `npm run pm2:start:auto` | Auto-detect | Quick deployment, testing |
| `./start-on-available-port.sh` | Auto-detect from 3005 | Default auto-port |
| `./start-on-available-port.sh 5000` | Auto-detect from 5000 | Custom port range |
| `./deploy-pi.sh` | Prompts for choice | Interactive deployment |

## ⚙️ How It Works

1. **`find-port.js`** creates a test server on each port
2. If port is **in use**, it tries the next one
3. If port is **available**, it returns that port number
4. **`start-on-available-port.sh`** uses that port with PM2
5. PM2 starts `serve` with the specified port
6. App is accessible on the found port

## 🎯 Benefits

- ✅ No manual port configuration needed
- ✅ Prevents "port already in use" errors
- ✅ Great for development/testing multiple instances
- ✅ Can still use fixed ports when needed
- ✅ Works with existing PM2 commands
- ✅ Firewall-friendly (can allow port ranges)

## 📚 Documentation

- **Detailed Guide**: [AUTO-PORT-GUIDE.md](AUTO-PORT-GUIDE.md)
- **Main Docs**: [README.md](README.md)
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)

## 🔄 Switching Between Methods

### From Fixed to Auto-Port

```bash
pm2 stop seedling
./start-on-available-port.sh
```

### From Auto-Port to Fixed

```bash
pm2 stop seedling
npm run pm2:start
```

## ⚠️ Important Notes

1. **Port < 1024**: Requires root privileges (not recommended)
2. **Firewall**: Update firewall rules for the new port
3. **Nginx**: Update reverse proxy config if port changes
4. **Documentation**: Always note which port you're using
5. **PM2 Persistence**: Changes are saved with `pm2 save`

## 🎉 You're Ready!

The auto-port feature is now fully integrated. Use it when you need flexibility, or stick with the default port 3005 for stable production deployments.

For questions or issues, see [AUTO-PORT-GUIDE.md](AUTO-PORT-GUIDE.md) for detailed troubleshooting.
