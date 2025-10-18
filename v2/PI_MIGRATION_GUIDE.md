# 🥧 Raspberry Pi 5 Migration Guide for StorySeed

This guide will help you set up and run StorySeed on your Raspberry Pi 5 with local PostgreSQL and Better Auth.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Hardware Requirements](#hardware-requirements)
3. [Initial Pi Setup](#initial-pi-setup)
4. [Install PostgreSQL](#install-postgresql)
5. [Install Node.js](#install-nodejs)
6. [Clone and Setup Project](#clone-and-setup-project)
7. [Database Migration](#database-migration)
8. [Configure Environment Variables](#configure-environment-variables)
9. [Install Dependencies](#install-dependencies)
10. [Build and Run](#build-and-run)
11. [Access from Other Devices](#access-from-other-devices)
12. [Troubleshooting](#troubleshooting)
13. [Backup and Maintenance](#backup-and-maintenance)

---

## Prerequisites

- Raspberry Pi 5 (4GB or 8GB RAM recommended)
- MicroSD card (32GB+ recommended, Class 10 or better)
- Raspberry Pi OS (64-bit recommended)
- Internet connection
- Basic command line knowledge

## Hardware Requirements

**Minimum:**
- Raspberry Pi 5 with 4GB RAM
- 32GB microSD card
- 5V 5A USB-C power supply
- Active cooling (fan or heatsink)

**Recommended:**
- Raspberry Pi 5 with 8GB RAM
- 64GB+ microSD card (or SSD via USB 3.0 for better performance)
- Official Raspberry Pi Active Cooler
- Ethernet connection (more stable than WiFi)

## Initial Pi Setup

### 1. Install Raspberry Pi OS

```bash
# Use Raspberry Pi Imager to flash Raspberry Pi OS (64-bit) to your SD card
# Enable SSH in imager settings before flashing
# Set hostname, username, and WiFi credentials
```

### 2. Update System

```bash
# SSH into your Pi
ssh pi@raspberrypi.local

# Update package lists and upgrade
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget vim nano htop
```

### 3. Set Static IP (Optional but Recommended)

```bash
# Edit dhcpcd.conf
sudo nano /etc/dhcpcd.conf

# Add at the end (adjust for your network):
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8

# Save and reboot
sudo reboot
```

## Install PostgreSQL

### 1. Install PostgreSQL

```bash
# Install PostgreSQL and contrib package
sudo apt install -y postgresql postgresql-contrib

# Check PostgreSQL status
sudo systemctl status postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql
```

### 2. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt:
# Create a database
CREATE DATABASE seedling;

# Create a user with password (REPLACE with your own secure password!)
CREATE USER seedlinguser WITH PASSWORD 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE seedling TO seedlinguser;

# Grant schema privileges
\c seedling
GRANT ALL ON SCHEMA public TO seedlinguser;

# Exit PostgreSQL
\q
```

### 3. Configure PostgreSQL for Local Access

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Find the line:
# local   all             all                                     peer

# Change to:
# local   all             all                                     md5

# Save and restart PostgreSQL
sudo systemctl restart postgresql
```

## Install Node.js

### Install Node.js 20.x (LTS)

```bash
# Download and install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

## Clone and Setup Project

### 1. Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/abe-mart/seedling.git
cd seedling/v2
```

### 2. Generate Better Auth Secret

```bash
# Generate a secure secret key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Copy the output - you'll need it for .env file
```

## Database Migration

### 1. Run Migration Script

```bash
# From the v2 directory
cd ~/seedling/v2

# Run the migration
sudo -u postgres psql -d seedling -f database/pi_migration.sql
```

### 2. Verify Database Setup

```bash
# Connect to database
sudo -u postgres psql -d seedling

# List tables
\dt

# You should see: user, session, account, verification, profiles, series, 
# books, story_elements, prompts, responses, user_settings

# Exit
\q
```

## Configure Environment Variables

### 1. Create .env File

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file
nano .env
```

### 2. Configure .env

```bash
# Database Configuration
DB_USER=seedlinguser
DB_PASSWORD=your_secure_password_here  # Use the password you set earlier
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seedling

# Better Auth Configuration
BETTER_AUTH_SECRET=paste_generated_secret_here  # From earlier step

# OpenAI API
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (use your Pi's IP)
FRONTEND_URL=http://192.168.1.100:3000  # Adjust to your Pi's IP
```

**Important:** Replace `192.168.1.100` with your Pi's actual IP address!

## Install Dependencies

### 1. Install Project Dependencies

```bash
# From the v2 directory
cd ~/seedling/v2

# Install dependencies (this may take 5-10 minutes on Pi)
npm install

# If you encounter memory issues, try:
# NODE_OPTIONS="--max-old-space-size=2048" npm install
```

## Build and Run

### 1. Build the Frontend

```bash
# Build the production frontend
npm run build

# This creates the dist/ folder with optimized static files
```

### 2. Start the Server

```bash
# Start the server (combines frontend + backend)
npm start

# You should see:
# 🌱 StorySeed Server Running
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📡 Server: http://localhost:3000
# 🌍 Network: http://0.0.0.0:3000
# 🔐 Auth: Better Auth
# 🗄️  Database: PostgreSQL
# 🤖 AI: OpenAI GPT-4o-mini
```

### 3. Test Locally

Open a browser on your Pi and go to `http://localhost:3000`

## Access from Other Devices

### 1. Find Your Pi's IP Address

```bash
# On your Pi
hostname -I

# Or
ip addr show
```

### 2. Access from Network Devices

From any device on your local network, go to:
```
http://192.168.1.100:3000
```
(Replace with your Pi's actual IP)

### 3. Set up as System Service (Optional)

Create a systemd service to run StorySeed automatically:

```bash
# Create service file
sudo nano /etc/systemd/system/storyseed.service
```

Add this content:

```ini
[Unit]
Description=StorySeed Writing App
After=network.target postgresql.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/seedling/v2
Environment=NODE_ENV=production
ExecStart=/usr/bin/node backend/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable storyseed

# Start the service
sudo systemctl start storyseed

# Check status
sudo systemctl status storyseed

# View logs
sudo journalctl -u storyseed -f
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID

# Or use a different port in .env:
PORT=3001
```

### PostgreSQL Connection Errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -U seedlinguser -d seedling -h localhost

# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Out of Memory During Build

```bash
# Add swap space (if not already present)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Change CONF_SWAPSIZE=100 to CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Build with memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Can't Access from Other Devices

```bash
# Check firewall (usually not enabled by default on Pi OS)
sudo ufw status

# If firewall is active, allow port 3000
sudo ufw allow 3000/tcp

# Make sure server is binding to 0.0.0.0, not just localhost
# This is already configured in backend/server.js
```

### Database Migration Errors

```bash
# If tables already exist, you can drop and recreate:
sudo -u postgres psql -d seedling

# Drop all tables (BE CAREFUL - THIS DELETES DATA!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO seedlinguser;
\q

# Run migration again
sudo -u postgres psql -d seedling -f database/pi_migration.sql
```

## Backup and Maintenance

### Database Backups

```bash
# Create backup directory
mkdir -p ~/seedling-backups

# Backup database
sudo -u postgres pg_dump seedling > ~/seedling-backups/seedling-$(date +%Y%m%d-%H%M%S).sql

# Automate daily backups with cron
crontab -e

# Add this line for daily 2 AM backups:
0 2 * * * sudo -u postgres pg_dump seedling > /home/pi/seedling-backups/seedling-$(date +\%Y\%m\%d).sql
```

### Restore from Backup

```bash
# Stop the service
sudo systemctl stop storyseed

# Restore database
sudo -u postgres psql -d seedling < ~/seedling-backups/seedling-20241018-020000.sql

# Start the service
sudo systemctl start storyseed
```

### Update Application

```bash
# Navigate to project
cd ~/seedling/v2

# Stop service
sudo systemctl stop storyseed

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Start service
sudo systemctl start storyseed
```

### Monitor Resource Usage

```bash
# Real-time monitoring
htop

# Check disk usage
df -h

# Check PostgreSQL activity
sudo -u postgres psql -d seedling -c "SELECT * FROM pg_stat_activity;"
```

## Security Best Practices

1. **Change Default Passwords**: Use strong, unique passwords for PostgreSQL
2. **Keep System Updated**: Regularly run `sudo apt update && sudo apt upgrade`
3. **Firewall**: Consider enabling UFW and only allowing necessary ports
4. **SSH Keys**: Use SSH keys instead of password authentication
5. **Backup Regularly**: Automate database backups
6. **Don't Expose to Internet**: Keep your Pi on local network only

## Performance Tips

1. **Use SSD Instead of SD Card**: Significantly faster database operations
2. **Enable Zram**: Better memory compression
3. **Adjust PostgreSQL Settings**: Tune for Raspberry Pi in `/etc/postgresql/15/main/postgresql.conf`
4. **Monitor Temperature**: Ensure Pi stays cool under 70°C
5. **Use Ethernet**: More stable than WiFi

## Next Steps

- ✅ Set up automatic backups
- ✅ Configure systemd service for auto-start
- ✅ Create your first user account
- ✅ Start your first writing project!
- 📱 Access from phone/tablet on your network
- 🎨 Customize the application

---

## Need Help?

- Check application logs: `sudo journalctl -u storyseed -f`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`
- Review COMPONENT_MIGRATION.md for component-specific changes
- Open an issue on GitHub if you encounter problems

**Happy Writing! 🌱✍️**
