# Deployment Checklist

Use this checklist to ensure a smooth deployment.

## Pre-Deployment

### Windows Development
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured with Supabase credentials
- [ ] Database migrations applied in Supabase
- [ ] Development server runs successfully (`npm run dev`)
- [ ] Build completes without errors (`npm run build`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)

### Raspberry Pi Setup
- [ ] Raspberry Pi OS installed and updated
- [ ] SSH access configured
- [ ] Static IP or hostname configured
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Database created and configured
- [ ] PM2 installed globally
- [ ] Git installed

## Deployment Steps

### Initial Deployment
- [ ] Repository cloned to `/home/pi/seedling`
- [ ] `.env` file created and configured
- [ ] Dependencies installed (`npm install`)
- [ ] Database migrations applied
- [ ] Application built (`npm run build`)
- [ ] PM2 configured and started (`npm run pm2:start`)
- [ ] PM2 process saved (`pm2 save`)
- [ ] PM2 startup configured (`pm2 startup`)
- [ ] Application accessible on network
- [ ] Logs directory created (`mkdir -p logs`)

### Updates
- [ ] Code pulled from repository (`git pull`)
- [ ] Dependencies updated if needed (`npm install`)
- [ ] New migrations applied (if any)
- [ ] Application rebuilt (`npm run build`)
- [ ] PM2 restarted (`npm run pm2:restart`)
- [ ] Application tested and working

## Post-Deployment

### Testing
- [ ] Application loads in browser
- [ ] Authentication works
- [ ] Database operations work
- [ ] No console errors
- [ ] Mobile responsive design works
- [ ] Performance is acceptable

### Monitoring
- [ ] PM2 status shows running (`pm2 status`)
- [ ] No errors in PM2 logs (`pm2 logs seedling`)
- [ ] Application logs are clean (`tail -f logs/*.log`)
- [ ] PostgreSQL is running (`sudo systemctl status postgresql`)
- [ ] Disk space is adequate (`df -h`)
- [ ] Memory usage is normal (`free -h`)

### Security
- [ ] `.env` file is not in git repository
- [ ] Strong database password used
- [ ] Firewall configured (if needed)
- [ ] PostgreSQL not exposed to public internet
- [ ] Regular backups scheduled
- [ ] Supabase RLS policies enabled
- [ ] HTTPS configured (if using domain)

## Optional Enhancements

### Performance
- [ ] Nginx reverse proxy configured
- [ ] Gzip compression enabled
- [ ] Static assets cached
- [ ] Database indexes optimized

### Reliability
- [ ] Automated backups configured
- [ ] Monitoring/alerting set up
- [ ] Swap space configured (if needed)
- [ ] Log rotation configured

### Access
- [ ] Custom domain configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] DDNS configured (if dynamic IP)
- [ ] VPN access set up (if needed)

## Rollback Plan

If deployment fails:
1. Check PM2 logs: `pm2 logs seedling`
2. Check application logs: `tail -f logs/*.log`
3. Verify environment variables in `.env`
4. Test database connection
5. If needed, revert to previous commit:
   ```bash
   git log  # Find previous commit hash
   git checkout <previous-commit-hash>
   npm install
   npm run build
   npm run pm2:restart
   ```

## Maintenance Schedule

### Daily
- [ ] Check PM2 status
- [ ] Monitor disk space

### Weekly
- [ ] Review application logs
- [ ] Check for security updates
- [ ] Verify backups are working

### Monthly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Update Node.js dependencies: `npm update`
- [ ] Review and rotate logs
- [ ] Test backup restoration

## Support Contacts

- **Documentation**: See README.md and QUICKSTART.md
- **Issues**: [GitHub Issues]
- **Supabase Support**: https://supabase.com/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs/

## Notes

Date: ________________

Deployed by: ________________

Version/Commit: ________________

Issues encountered: ________________

Resolution: ________________
