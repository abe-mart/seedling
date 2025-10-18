# 🚀 StorySeed - Quick Reference Card

## Essential Commands

### Development
```bash
# Frontend dev server (Vite)
npm run dev

# Backend dev server only
npm run dev:server

# Type checking
npm run typecheck

# Lint code
npm run lint
```

### Production
```bash
# Build frontend
npm run build

# Start production server (frontend + backend)
npm start

# Alternative: separate commands
npm run build && node backend/server.js
```

### Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql -d seedling

# Run migration
sudo -u postgres psql -d seedling -f database/pi_migration.sql

# Backup database
sudo -u postgres pg_dump seedling > backup.sql

# Restore database
sudo -u postgres psql -d seedling < backup.sql
```

### System Service (Pi)
```bash
# Start service
sudo systemctl start storyseed

# Stop service
sudo systemctl stop storyseed

# Restart service
sudo systemctl restart storyseed

# View status
sudo systemctl status storyseed

# View logs
sudo journalctl -u storyseed -f
```

---

## API Endpoints Reference

### Auth (Better Auth)
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get current session

### Profiles
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update profile

### Books
- `GET /api/books` - List all books for user
- `POST /api/books` - Create new book

### Story Elements
- `GET /api/elements?book_id={id}` - List elements for book
- `GET /api/elements/{id}` - Get single element
- `POST /api/elements` - Create new element
- `PUT /api/elements/{id}` - Update element
- `DELETE /api/elements/{id}` - Delete element

### Prompts
- `GET /api/prompts?book_id={id}&limit={n}` - List prompts
- `GET /api/prompts/{id}` - Get single prompt
- `POST /api/prompts` - Create new prompt

### Responses
- `GET /api/responses?prompt_id={id}` - List responses for prompt
- `POST /api/responses` - Create new response
- `PUT /api/responses/{id}` - Update response

### AI
- `POST /api/generate-prompt` - Generate AI prompt
- `POST /api/available-modes` - Get available modes for elements

---

## Environment Variables

```bash
# Database
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seedling

# Auth
BETTER_AUTH_SECRET=base64_secret_here

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

---

## Project Structure

```
v2/
├── backend/
│   ├── server.js          # Main Express server
│   ├── auth.js            # Better Auth config
│   ├── db.js              # PostgreSQL connection
│   └── api/
│       └── openai.js      # OpenAI integration
├── database/
│   └── pi_migration.sql   # PostgreSQL schema
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── lib/
│   │   ├── api.ts         # API client
│   │   └── auth-client.ts # Better Auth client
│   ├── App.tsx
│   └── main.tsx
├── dist/                  # Built frontend (generated)
├── .env                   # Environment variables (SECRET!)
├── package.json
└── vite.config.ts
```

---

## Common Tasks

### Add a New User (Via UI)
1. Go to `http://your-pi-ip:3000`
2. Click "Sign Up"
3. Enter email and password
4. Profile created automatically

### Check Database
```bash
# List all users
sudo -u postgres psql -d seedling -c "SELECT id, email, name FROM \"user\";"

# Count books per user
sudo -u postgres psql -d seedling -c "SELECT u.email, COUNT(b.id) as books FROM \"user\" u LEFT JOIN books b ON u.id = b.user_id GROUP BY u.email;"

# View recent prompts
sudo -u postgres psql -d seedling -c "SELECT prompt_text, generated_at FROM prompts ORDER BY generated_at DESC LIMIT 5;"
```

### Update Application
```bash
cd ~/seedling/v2
sudo systemctl stop storyseed
git pull
npm install
npm run build
sudo systemctl start storyseed
```

### Monitor Performance
```bash
# CPU and memory
htop

# Disk usage
df -h

# Database connections
sudo -u postgres psql -d seedling -c "SELECT count(*) FROM pg_stat_activity;"

# Check process
ps aux | grep node
```

---

## Network Access

### From Same Device
```
http://localhost:3000
```

### From Other Devices (LAN)
```
http://192.168.1.100:3000
```
(Replace with your Pi's IP)

### Find Pi's IP
```bash
hostname -I
# or
ip addr show
```

---

## Troubleshooting Quick Fixes

### Server won't start
```bash
# Check port 3000
sudo lsof -i :3000
sudo kill -9 <PID>

# Check logs
npm start 2>&1 | tee error.log
```

### Database connection failed
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -U seedlinguser -d seedling -h localhost
```

### Can't connect from another device
```bash
# Check server is running
systemctl status storyseed

# Check it's bound to 0.0.0.0, not 127.0.0.1
sudo netstat -tlnp | grep 3000
```

### Out of memory
```bash
# Check swap
free -h

# Increase swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

## Security Checklist

- [ ] Strong PostgreSQL password set
- [ ] `.env` file not committed to git
- [ ] `BETTER_AUTH_SECRET` is random and secure
- [ ] PostgreSQL only accepts local connections
- [ ] Pi has static IP address
- [ ] Regular backups configured
- [ ] System kept up to date (`sudo apt update && sudo apt upgrade`)
- [ ] SSH uses key authentication (not password)

---

## Backup Strategy

### Daily Automated Backup
```bash
# Add to crontab
crontab -e

# Daily at 2 AM
0 2 * * * sudo -u postgres pg_dump seedling > /home/pi/backups/seedling-$(date +\%Y\%m\%d).sql
```

### Manual Backup Before Changes
```bash
sudo -u postgres pg_dump seedling > ~/backup-$(date +%Y%m%d-%H%M%S).sql
```

---

## Support Resources

- **PI_MIGRATION_GUIDE.md** - Full setup instructions
- **MIGRATION_STATUS.md** - What's done, what's left
- **COMPONENT_MIGRATION.md** - Code update patterns
- **GitHub Issues** - Report problems

---

**Quick Start:** Read `MIGRATION_STATUS.md` → Follow `PI_MIGRATION_GUIDE.md` → Update components using `COMPONENT_MIGRATION.md` → Test → Deploy!
