# StorySeed Commercial Launch Guide

## Current State Assessment

**What's Working Well:**
- ✅ Professional, beautiful UI with landing page
- ✅ Core features implemented (prompts, responses, streaks, email scheduling)
- ✅ Better Auth authentication system
- ✅ PostgreSQL database with proper schema
- ✅ Resend email service configured
- ✅ Custom domain (storyseed.martinapps.org)
- ✅ PWA foundation started
- ✅ Proper SQL parameterization (SQL injection protected)

**What Needs Work:**
- ⚠️ Infrastructure: Running on Raspberry Pi (not production-grade)
- ⚠️ No payment/subscription system
- ⚠️ Missing legal documents (Privacy Policy, Terms of Service)
- ⚠️ No error monitoring or analytics
- ⚠️ No automated testing
- ⚠️ Limited security hardening
- ⚠️ No staging environment

---

## 🔒 SECURITY FIRST: Critical Warning

**DO NOT deploy to public internet without completing Phase 1.1 Security Hardening**

Your current Raspberry Pi setup is great for development, but exposing it publicly without proper security is **dangerous**. Complete ALL security steps before deploying.

### What Makes a Site Unsafe?

❌ **Currently Vulnerable:**
- No rate limiting → DDoS attacks, brute force
- No input validation → SQL injection, XSS attacks
- No CORS protection → Cross-site attacks
- No security headers → Various exploits
- Exposed admin endpoints → Unauthorized access
- Weak session management → Session hijacking

✅ **After Security Hardening:**
- Rate limited (5 auth attempts/15min)
- All inputs validated & sanitized
- CORS configured (only your domain)
- Security headers (helmet, CSP)
- Protected endpoints
- Secure session cookies (httpOnly, sameSite)

### Security Implementation Timeline

**Week 1 - Days 1-2: Security Hardening** (Section 1.1)
- Install security dependencies
- Add input validation to ALL endpoints
- Configure rate limiting
- Set up security headers
- Test security measures locally

**Week 1 - Days 3-4: Infrastructure Setup** (Section 1.2)
- Set up Railway
- Deploy with secure env variables
- Configure SSL/HTTPS
- Test production security

**Week 1 - Day 5: Security Testing** (Section 1.4)
- Run automated scans
- Manual penetration testing
- Fix any issues found

**Never skip security steps to "launch faster" - the risk is not worth it.**

---

## Phase 1: Foundation (Week 1-2) - CRITICAL FOR LAUNCH

### 1.1 Security Hardening (DO THIS FIRST - Before Exposing Online)

**CRITICAL: Complete ALL security steps before deploying to public internet**

#### 1.1.1 Install Security Dependencies

```bash
cd /home/pi/seedling/v2/backend
npm install helmet express-rate-limit cors express-validator hpp express-mongo-sanitize
```

#### 1.1.2 Update server.js with Security Middleware

**Add at the top of server.js (after imports):**

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const hpp = require('hpp');

// ============================================
// SECURITY CONFIGURATION - CRITICAL
// ============================================

// 1. Security Headers (helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

// 2. CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600 // 10 minutes
}));

// 3. Rate Limiting - Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// 4. Rate Limiting - Authentication (STRICT)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 auth attempts per window
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});

// 5. Rate Limiting - API calls (MODERATE)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: 'Too many API requests, please slow down.',
});

// 6. HTTP Parameter Pollution Protection
app.use(hpp());

// 7. Body size limits (prevent payload attacks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiters
app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);
app.use(globalLimiter);

// ============================================
// INPUT VALIDATION MIDDLEWARE
// ============================================

// Validation helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Email validation
const validateEmail = body('email')
  .trim()
  .isEmail()
  .normalizeEmail()
  .isLength({ max: 255 })
  .withMessage('Valid email required');

// Password validation
const validatePassword = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be 8-128 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain uppercase, lowercase, and number');

// Text content validation (responses, story elements)
const validateText = (field, maxLength = 10000) => 
  body(field)
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} must be 1-${maxLength} characters`);

// ID validation
const validateId = (field) =>
  body(field)
    .isInt({ min: 1 })
    .withMessage(`${field} must be a valid positive integer`);

// Export validators for use in routes
module.exports.validators = {
  validateEmail,
  validatePassword,
  validateText,
  validateId,
  validate
};
```

#### 1.1.3 Update Auth Endpoints with Validation

**Find your auth endpoints and add validation:**

```javascript
// Example: Registration endpoint
app.post('/api/auth/register', 
  [validateEmail, validatePassword, validate],
  async (req, res) => {
    // Your registration logic
  }
);

// Example: Login endpoint
app.post('/api/auth/login',
  [validateEmail, validate],
  async (req, res) => {
    // Your login logic
  }
);
```

#### 1.1.4 Update API Endpoints with Validation

**Add validation to all input endpoints:**

```javascript
// Story elements
app.post('/api/elements',
  authMiddleware,
  [
    validateText('name', 200),
    validateText('description', 2000),
    body('type').isIn(['character', 'location', 'theme', 'plot']),
    validate
  ],
  async (req, res) => {
    // Your logic
  }
);

// Responses
app.post('/api/responses',
  authMiddleware,
  [
    validateId('prompt_id'),
    validateText('response_text', 50000),
    body('word_count').optional().isInt({ min: 0, max: 50000 }),
    validate
  ],
  async (req, res) => {
    // Your logic
  }
);
```

#### 1.1.5 Add Security Headers to Responses

**Add this middleware near the top of server.js:**

```javascript
// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

#### 1.1.6 Environment Variable Security

**Create .env.example (safe to commit):**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
BETTER_AUTH_SECRET=your-secret-here-32-chars-minimum
BETTER_AUTH_URL=https://your-domain.com
RESEND_API_KEY=re_your_key_here
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
PORT=3000
```

**NEVER commit actual .env file. Add to .gitignore:**
```bash
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

**Generate secure secrets:**
```bash
# Generate BETTER_AUTH_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate another strong secret if needed
openssl rand -base64 32
```

#### 1.1.7 Database Security

**Add these to your PostgreSQL setup:**

```sql
-- Ensure proper user permissions (not superuser)
CREATE USER storyseed_app WITH PASSWORD 'strong-random-password-here';
GRANT CONNECT ON DATABASE seedling_db TO storyseed_app;
GRANT USAGE ON SCHEMA public TO storyseed_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO storyseed_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO storyseed_app;

-- Row Level Security (RLS) policies
ALTER TABLE story_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own data
CREATE POLICY user_isolation_elements ON story_elements
  FOR ALL
  USING (user_id = current_setting('app.user_id')::INTEGER);

CREATE POLICY user_isolation_responses ON responses
  FOR ALL
  USING (user_id = current_setting('app.user_id')::INTEGER);

CREATE POLICY user_isolation_profiles ON profiles
  FOR ALL
  USING (user_id = current_setting('app.user_id')::INTEGER);
```

#### 1.1.8 SQL Injection Prevention Checklist

**Review all queries - MUST use parameterized queries:**

✅ **SAFE - Parameterized:**
```javascript
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

❌ **UNSAFE - String concatenation:**
```javascript
await pool.query(`SELECT * FROM users WHERE id = ${userId}`); // NEVER DO THIS
```

**Audit all queries in your codebase:**
```bash
cd /home/pi/seedling/v2/backend
grep -r "pool.query" . --include="*.js" | grep -v "\$[0-9]"
# This finds queries without parameterization - FIX THESE!
```

#### 1.1.9 XSS Prevention

**Sanitize user input before storing (already using parameterized queries helps):**

```bash
npm install xss
```

```javascript
const xss = require('xss');

// For rich text content (responses, descriptions)
const sanitizedText = xss(req.body.response_text, {
  whiteList: {}, // No HTML allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
});
```

**Frontend - ensure you're not using dangerouslySetInnerHTML:**
```bash
cd /home/pi/seedling/v2
grep -r "dangerouslySetInnerHTML" . --include="*.tsx" --include="*.jsx"
# Should return nothing or be very carefully reviewed
```

#### 1.1.10 Session Security

**Ensure Better Auth is configured securely:**

```javascript
// In your auth configuration
{
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Not accessible via JavaScript
    sameSite: 'lax', // CSRF protection
    domain: process.env.NODE_ENV === 'production' ? 'your-domain.com' : undefined
  }
}
```

#### 1.1.11 Error Handling (Don't Leak Info)

**Add global error handler at the END of server.js:**

```javascript
// Error handler (must be last)
app.use((err, req, res, next) => {
  // Log full error server-side
  console.error('Error:', err);
  
  // Send minimal info to client
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});
```

#### 1.1.12 Security Testing Checklist

Before going live, test:

- [ ] **SQL Injection**: Try `' OR '1'='1` in inputs
- [ ] **XSS**: Try `<script>alert('xss')</script>` in text fields
- [ ] **Rate Limiting**: Make 10+ rapid requests, should get 429 error
- [ ] **CORS**: Try accessing API from unauthorized domain
- [ ] **Authentication**: Try accessing protected routes without login
- [ ] **Authorization**: Try accessing other users' data
- [ ] **File Upload**: If implemented, test with .exe, .php files
- [ ] **Large Payloads**: Send 100MB JSON, should be rejected
- [ ] **Password Requirements**: Test weak passwords, should be rejected

**Run automated security scan:**
```bash
npm install -g snyk
cd /home/pi/seedling/v2/backend
npm audit
snyk test
```

---

### 1.2 Production Infrastructure Migration

**Goal:** Move from Raspberry Pi to production-grade hosting with Railway (All-in-One)

#### Why Railway All-in-One?

**Advantages:**
- ✅ Single dashboard for everything
- ✅ One bill, one login
- ✅ Private internal networking (frontend ↔ backend ↔ database)
- ✅ No CORS/cross-origin complications
- ✅ Faster deployment
- ✅ Easier debugging
- ✅ Cost: ~$20-30/month for all three services

**Architecture:**
```
Railway Project: StorySeed Production
├── Service: PostgreSQL (managed database)
├── Service: Backend (Node.js + Express)
└── Service: Frontend (Vite build → static files)
```

#### Step-by-Step Railway Setup

**1. Install Railway CLI:**
```bash
npm install -g @railway/cli
```

**2. Login and Create Project:**
```bash
railway login
# Opens browser for authentication

# Create new project
railway init
# Choose: "Empty Project"
# Name it: "storyseed-production"
```

**3. Add PostgreSQL Database:**
```bash
railway add
# Choose: PostgreSQL
# Railway provisions managed PostgreSQL instance
```

**4. Export Your Current Data:**
```bash
# Backup current database
pg_dump -U seedling_user -h localhost seedling_db > storyseed_backup_$(date +%Y%m%d).sql

# Clean up backup for Railway (remove local user references)
sed -i 's/seedling_user/postgres/g' storyseed_backup_*.sql
```

**5. Import to Railway Database:**
```bash
# Get Railway database credentials
railway variables
# Look for DATABASE_URL

# Import data
railway run psql -f storyseed_backup_*.sql
# Or use the DATABASE_URL directly:
# psql [RAILWAY_DATABASE_URL] < storyseed_backup_*.sql
```

**6. Deploy Backend Service:**
```bash
cd /home/pi/seedling/v2/backend

# Create service
railway service create
# Name: "backend"

# Link to project
railway link
# Choose: storyseed-production → backend

# Set environment variables
railway variables set NODE_ENV=production
railway variables set BETTER_AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set RESEND_API_KEY=your_resend_key_here

# Deploy
railway up
# Railway auto-detects Node.js and starts your app
```

**7. Configure Backend Domain:**
```bash
railway domain
# Railway generates: storyseed-production-backend.up.railway.app
# Or add custom: api.storyseed.com
```

**8. Deploy Frontend Service:**
```bash
cd /home/pi/seedling/v2

# Create frontend service
railway service create
# Name: "frontend"

railway link
# Choose: storyseed-production → frontend

# Create nixpacks.toml for Vite build
cat > nixpacks.toml << 'EOF'
[phases.setup]
nixPkgs = ['nodejs_18']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npx serve -s dist -l $PORT'
EOF

# Deploy
railway up
```

**9. Configure Frontend Domain:**
```bash
railway domain
# Generates: storyseed-production.up.railway.app
# Or add custom: storyseed.com
```

**10. Link Services (Internal Networking):**

In Railway dashboard:
1. Go to Backend service → Variables
2. Set `FRONTEND_URL` = your frontend Railway URL
3. Set `ALLOWED_ORIGINS` = your frontend Railway URL
4. Set `BETTER_AUTH_URL` = your backend Railway URL
5. Database URL is automatically injected

In Frontend service:
1. Create `.env.production` (add to .gitignore!)
2. Set `VITE_API_URL` = your backend Railway URL

**11. Update vite.config.ts for production:**
```typescript
export default defineConfig({
  plugins: [react(), VitePWA({...})],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
```

**12. Environment Variables Summary:**

**Backend Service (Railway):**
```bash
NODE_ENV=production
DATABASE_URL=<auto-injected-by-railway>
BETTER_AUTH_SECRET=<generate-with-crypto-random>
BETTER_AUTH_URL=https://storyseed-production-backend.up.railway.app
RESEND_API_KEY=<your-resend-key>
FRONTEND_URL=https://storyseed-production.up.railway.app
ALLOWED_ORIGINS=https://storyseed-production.up.railway.app,https://storyseed.com
PORT=3000
```

**Frontend Service (Railway):**
```bash
VITE_API_URL=https://storyseed-production-backend.up.railway.app
```

#### When to Consider Splitting to Multiple Providers

**Stay on Railway until you hit:**
- 10,000+ daily active users
- 1M+ requests/month
- Need CDN edge caching globally
- Need edge functions (Vercel/Cloudflare Workers)

**Then consider:**
- Frontend → Vercel/Cloudflare Pages (CDN benefits)
- Backend → Keep on Railway (scales well)
- Database → Upgrade Railway DB or move to Neon/Supabase

### 1.3 Domain & DNS

**Goal:** Professional domain and proper DNS setup

**Options:**
1. **Keep storyseed.martinapps.org** (subdomain) - OK for beta testing
2. **Buy storyseed.com** or similar (Recommended for commercial) ⭐
   - Cost: $10-15/year
   - Purchase from: Cloudflare Registrar (cheapest), Namecheap, or Porkbun

#### Custom Domain Setup with Railway

**After purchasing domain:**

1. **In Railway dashboard:**
   - Go to Frontend service
   - Settings → Domains
   - Click "Add Domain"
   - Enter: `storyseed.com` and `www.storyseed.com`
   - Railway provides CNAME target

2. **In your DNS provider (Cloudflare example):**
```
Type    Name    Target
CNAME   @       storyseed-production.up.railway.app
CNAME   www     storyseed-production.up.railway.app
```

3. **Wait for DNS propagation** (5-60 minutes)

4. **Verify SSL:**
   - Railway automatically provisions SSL certificate
   - Check: https://storyseed.com (should show 🔒)

**Optional: API subdomain (if you split later):**
```
CNAME   api     storyseed-backend.up.railway.app
```

### 1.4 Pre-Deployment Security Verification

**Before deploying to Railway, run these checks:**

#### Security Audit
```bash
cd /home/pi/seedling/v2/backend
npm audit --production
npm audit fix

# Check for vulnerable dependencies
npx snyk test
```

#### Code Review Checklist
```bash
# Find any unsafe query patterns
grep -r "pool.query" . --include="*.js" | grep -v "\$[0-9]"
# Should return NOTHING - all queries must be parameterized

# Check for dangerouslySetInnerHTML
cd /home/pi/seedling/v2
grep -r "dangerouslySetInnerHTML" . --include="*.tsx"
# Review any results carefully

# Check for hardcoded secrets
grep -ri "api_key\|secret\|password" . --include="*.js" --include="*.ts" | grep -v "process.env"
# Should find NO hardcoded credentials
```

#### Test Rate Limiting Locally
```bash
# Start your backend locally
cd /home/pi/seedling/v2/backend
node server.js

# In another terminal, test rate limiting
for i in {1..10}; do curl http://localhost:3000/api/health; done
# Should see 429 error after hitting limit
```

#### Test Input Validation
```bash
# Try SQL injection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "' OR '1'='1"}'
# Should get validation error, NOT server error

# Try XSS
curl -X POST http://localhost:3000/api/elements \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"name": "<script>alert(1)</script>", "type": "character"}'
# Should be sanitized or rejected
```

---

## Phase 2: Legal & Compliance (Week 2-3) - REQUIRED BEFORE PUBLIC LAUNCH

### 2.1 Legal Documents

**Create these pages (can use templates):**

1. **Privacy Policy** (`/privacy`)
   - What data you collect
   - How you use it
   - Third parties (Resend for emails)
   - User rights (export, deletion)
   - Cookie usage
   
   **Free generators:**
   - https://www.termsfeed.com/privacy-policy-generator/
   - https://app.termly.io/

2. **Terms of Service** (`/terms`)
   - User responsibilities
   - Service limitations
   - Account termination
   - Intellectual property
   - Limitation of liability
   
   **Free generators:**
   - https://www.termsfeed.com/terms-service-generator/

3. **Cookie Policy** (if using analytics)

**Implementation:**
```bash
# Create new components
touch v2/src/components/Privacy.tsx
touch v2/src/components/Terms.tsx

# Add routes to App.tsx
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
```

**Add footer links** to Landing.tsx and Dashboard.tsx

### 2.2 GDPR Compliance

**Required features:**

1. **Data Export**
```javascript
// Add to server.js
app.get('/api/user/export', authMiddleware, async (req, res) => {
  const { rows: profile } = await pool.query(
    'SELECT * FROM profiles WHERE user_id = $1',
    [req.user.id]
  );
  const { rows: elements } = await pool.query(
    'SELECT * FROM story_elements WHERE user_id = $1',
    [req.user.id]
  );
  const { rows: responses } = await pool.query(
    'SELECT * FROM responses WHERE user_id = $1',
    [req.user.id]
  );
  
  res.json({
    profile: profile[0],
    elements,
    responses,
    exported_at: new Date().toISOString()
  });
});
```

2. **Account Deletion**
```javascript
// Add to server.js
app.delete('/api/user/account', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete all user data
    await client.query('DELETE FROM responses WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM story_elements WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM daily_prompts_sent WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM profiles WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM user WHERE id = $1', [req.user.id]);
    
    await client.query('COMMIT');
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
```

3. **Add Settings Page** with:
   - Export data button
   - Delete account button (with confirmation)
   - Email preferences

---

## Phase 3: Monetization (Week 3-4)

### 3.1 Pricing Strategy

**Recommended Tiers:**

1. **Free Tier**
   - 1 project
   - 1 daily prompt per day
   - Basic story elements (up to 20)
   - 7-day streak tracking
   
2. **Author Tier - $9/month**
   - Unlimited projects
   - Unlimited daily prompts
   - Unlimited story elements
   - Advanced analytics
   - Priority email delivery
   - Full streak history
   
3. **Pro Tier - $19/month** (future)
   - Everything in Author
   - AI analysis of writing patterns
   - Export to various formats
   - Collaborative features

### 3.2 Stripe Integration

**Setup:**
```bash
cd v2/backend
npm install stripe
```

**Create Stripe account and products:**
1. Go to https://stripe.com
2. Create account
3. Create products:
   - "StorySeed Author" - $9/month recurring

**Environment variables:**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_AUTHOR_PRICE_ID=price_...
```

**Backend implementation:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create checkout session
app.post('/api/subscribe/checkout', authMiddleware, async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    line_items: [{
      price: process.env.STRIPE_AUTHOR_PRICE_ID,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: {
      user_id: req.user.id
    }
  });
  
  res.json({ url: session.url });
});

// Webhook handler
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update user to paid tier
      await pool.query(
        'UPDATE profiles SET subscription_tier = $1, subscription_status = $2 WHERE user_id = $3',
        ['author', 'active', session.metadata.user_id]
      );
      break;
      
    case 'customer.subscription.deleted':
      // Downgrade user to free tier
      await pool.query(
        'UPDATE profiles SET subscription_tier = $1, subscription_status = $2 WHERE user_id = $3',
        ['free', 'cancelled', event.data.object.metadata.user_id]
      );
      break;
  }

  res.json({received: true});
});
```

**Database migration:**
```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN stripe_subscription_id VARCHAR(255);
```

**Frontend - Create Pricing page:**
```typescript
// v2/src/components/Pricing.tsx
export default function Pricing() {
  const handleSubscribe = async () => {
    const response = await fetch('/api/subscribe/checkout', {
      method: 'POST',
      credentials: 'include'
    });
    const { url } = await response.json();
    window.location.href = url;
  };
  
  // Beautiful pricing cards UI
}
```

### 3.3 Tier Enforcement

**Add middleware to check subscription:**
```javascript
// backend/middleware/subscription.js
const checkSubscription = (requiredTier = 'author') => {
  return async (req, res, next) => {
    const { rows } = await pool.query(
      'SELECT subscription_tier FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    
    const tier = rows[0]?.subscription_tier || 'free';
    
    if (tier === 'free' && requiredTier !== 'free') {
      return res.status(403).json({ 
        error: 'This feature requires a paid subscription',
        upgrade_url: '/pricing'
      });
    }
    
    next();
  };
};

// Use on premium endpoints
app.post('/api/elements', authMiddleware, checkSubscription('author'), async (req, res) => {
  // Check element count for free users
  const { rows } = await pool.query(
    'SELECT COUNT(*) FROM story_elements WHERE user_id = $1',
    [req.user.id]
  );
  
  if (req.user.subscription_tier === 'free' && rows[0].count >= 20) {
    return res.status(403).json({ 
      error: 'Free tier limited to 20 story elements. Upgrade to add more.',
      upgrade_url: '/pricing'
    });
  }
  
  // Continue with element creation
});
```

---

## Phase 4: Monitoring & Analytics (Week 4-5)

### 4.1 Error Tracking

**Sentry Setup:**
```bash
cd v2
npm install @sentry/react @sentry/vite-plugin

cd backend
npm install @sentry/node @sentry/profiling-node
```

**Frontend (main.tsx):**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://[YOUR-DSN]@sentry.io/[PROJECT-ID]",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Backend (server.js):**
```javascript
const Sentry = require("@sentry/node");
const { ProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: "https://[YOUR-DSN]@sentry.io/[PROJECT-ID]",
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Add after all other app.use() calls
app.use(Sentry.Handlers.errorHandler());
```

**Cost:** Free up to 5,000 events/month

### 4.2 User Analytics

**Plausible Analytics (Privacy-friendly, GDPR compliant):**

```html
<!-- Add to index.html -->
<script defer data-domain="storyseed.com" src="https://plausible.io/js/script.js"></script>
```

**Cost:** $9/month for up to 10k monthly visitors

**Alternative:** PostHog (open source, self-hosted option)

### 4.3 Application Monitoring

**Uptime Monitoring:**
- Use UptimeRobot (free for 50 monitors)
- Monitor: https://storyseed.com, https://api.storyseed.com/health

**Create health check endpoint:**
```javascript
app.get('/health', async (req, res) => {
  try {
    // Check database
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### 4.4 Performance Monitoring

**Lighthouse CI** for regular performance checks:
```bash
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage
```

**Set performance budgets:**
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3.5s

---

## Phase 5: Quality & Testing (Week 5-6)

### 5.1 Automated Testing

**Install testing tools:**
```bash
cd v2
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Example tests:**
```typescript
// v2/src/components/__tests__/Auth.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Auth from '../Auth';

describe('Auth Component', () => {
  it('renders login form', () => {
    render(<Auth />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
  
  it('validates email format', async () => {
    render(<Auth />);
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    // Assert validation error appears
  });
});
```

**Backend API tests:**
```javascript
// backend/tests/api.test.js
const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  it('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
});
```

### 5.2 CI/CD Pipeline

**GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd v2 && npm ci && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/cli@v2
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
      - run: cd v2/backend && railway up
```

### 5.3 Browser & Device Testing

**Test on:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Use BrowserStack** for automated cross-browser testing (free for open source)

---

## Phase 6: User Experience Polish (Week 6-7)

### 6.1 Onboarding Flow

**Create first-time user experience:**
```typescript
// v2/src/components/Onboarding.tsx
export default function Onboarding() {
  const steps = [
    {
      title: "Welcome to StorySeed!",
      description: "Let's get your story started in 3 quick steps.",
    },
    {
      title: "Create Your First Character",
      description: "Every story needs compelling characters.",
      action: "Create Character"
    },
    {
      title: "Set Up Daily Prompts",
      description: "Choose when you want to receive writing prompts.",
      action: "Set Preferences"
    }
  ];
  
  // Step-by-step wizard UI
}
```

**Track completion:**
```sql
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN onboarding_step INTEGER DEFAULT 0;
```

### 6.2 Help & Documentation

**Create Help Center:**
1. Getting Started guide
2. Video tutorials (Loom is free)
3. FAQ section
4. Keyboard shortcuts reference
5. Troubleshooting common issues

**Add in-app help:**
```typescript
// Add tooltips using @radix-ui/react-tooltip
npm install @radix-ui/react-tooltip
```

### 6.3 Email Templates

**Polish your email templates:**

**Welcome Email:**
```javascript
{
  from: 'StorySeed <hello@storyseed.com>',
  to: user.email,
  subject: 'Welcome to StorySeed! 🌱',
  html: `
    <h1>Welcome, ${user.name}!</h1>
    <p>We're excited to help you develop your story.</p>
    <h2>Your First Steps:</h2>
    <ol>
      <li>Add your story elements</li>
      <li>Set up your daily prompt preferences</li>
      <li>Start writing!</li>
    </ol>
    <a href="https://storyseed.com/dashboard">Get Started</a>
  `
}
```

**Use email template service:**
- MJML for responsive emails
- React Email for component-based templates

### 6.4 Loading & Error States

**Add throughout the app:**
```typescript
// Loading skeleton components
npm install react-loading-skeleton

// Error boundary
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// Wrap app
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

---

## Phase 7: SEO & Marketing Prep (Week 7-8)

### 7.1 SEO Optimization

**Add to index.html:**
```html
<head>
  <!-- Primary Meta Tags -->
  <title>StorySeed - AI-Powered Story Development for Authors</title>
  <meta name="title" content="StorySeed - AI-Powered Story Development for Authors">
  <meta name="description" content="Develop richer stories with AI-generated prompts that explore your characters, locations, and themes. Never writes for you—just helps you write better.">
  <meta name="keywords" content="writing app, story development, writing prompts, character development, creative writing">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://storyseed.com/">
  <meta property="og:title" content="StorySeed - AI-Powered Story Development for Authors">
  <meta property="og:description" content="Develop richer stories with AI-generated prompts that explore your characters, locations, and themes.">
  <meta property="og:image" content="https://storyseed.com/og-image.png">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://storyseed.com/">
  <meta property="twitter:title" content="StorySeed - AI-Powered Story Development for Authors">
  <meta property="twitter:description" content="Develop richer stories with AI-generated prompts that explore your characters, locations, and themes.">
  <meta property="twitter:image" content="https://storyseed.com/og-image.png">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://storyseed.com/" />
</head>
```

**Create OG image:**
- 1200x630px
- Use Figma or Canva
- Show app screenshot + branding

**Generate sitemap:**
```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://storyseed.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://storyseed.com/pricing</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://storyseed.com/privacy</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://storyseed.com/terms</loc>
    <priority>0.5</priority>
  </url>
</urlset>
```

**robots.txt:**
```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api/

Sitemap: https://storyseed.com/sitemap.xml
```

### 7.2 Google Search Console Setup

1. Go to https://search.google.com/search-console
2. Add property: storyseed.com
3. Verify ownership (HTML tag method)
4. Submit sitemap
5. Monitor indexing status

### 7.3 Social Media Presence

**Set up accounts:**
- Twitter/X: @storyseedapp
- Reddit: r/storyseed
- ProductHunt: Prepare launch
- Instagram: Share user testimonials

**Content ideas:**
- Writing tips
- User success stories
- Feature announcements
- Behind-the-scenes development

### 7.4 Launch Strategy

**Soft Launch Checklist:**
- [ ] Invite beta users (friends, writing communities)
- [ ] Set up feedback collection (Canny, Typeform)
- [ ] Monitor for bugs/issues
- [ ] Collect testimonials
- [ ] Iterate on feedback

**Public Launch Platforms:**
1. **ProductHunt** (Best for tech audience)
   - Schedule for Tuesday-Thursday
   - Prepare maker comments
   - Line up supporters to upvote
   
2. **Hacker News** (Show HN)
   - Be active in comments
   - Technical audience

3. **Reddit**
   - r/writing
   - r/writers
   - r/WritingPrompts
   - Follow subreddit rules!

4. **Writing Communities**
   - NaNoWriMo forums
   - Absolute Write Water Cooler
   - Writing.com

---

## Phase 8: Database & Performance Optimization (Ongoing)

### 8.1 Database Indexing

**Add indexes for common queries:**
```sql
-- User lookups
CREATE INDEX idx_user_email ON "user"(email);

-- Story elements by user
CREATE INDEX idx_story_elements_user ON story_elements(user_id);

-- Responses by user and date
CREATE INDEX idx_responses_user_date ON responses(user_id, completed_at DESC);

-- Daily prompts tracking
CREATE INDEX idx_daily_prompts_user_date ON daily_prompts_sent(user_id, sent_at DESC);

-- Subscription status
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier, subscription_status);
```

### 8.2 Query Optimization

**Add connection pooling config:**
```javascript
const pool = new Pool({
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Use prepared statements for frequent queries:**
```javascript
// Create prepared statement
const getProfileQuery = {
  name: 'get-profile',
  text: 'SELECT * FROM profiles WHERE user_id = $1',
};

// Use it
const result = await pool.query(getProfileQuery, [userId]);
```

### 8.3 Caching Strategy

**Install Redis:**
```bash
npm install redis
```

**Cache user sessions and rate limits:**
```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Cache user profile
async function getUserProfile(userId) {
  const cached = await client.get(`profile:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const { rows } = await pool.query(
    'SELECT * FROM profiles WHERE user_id = $1',
    [userId]
  );
  
  await client.setEx(`profile:${userId}`, 300, JSON.stringify(rows[0]));
  return rows[0];
}
```

### 8.4 Asset Optimization

**Image optimization:**
```bash
npm install sharp
```

**Lazy loading:**
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

**Bundle analysis:**
```bash
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});
```

---

## Launch Checklist

### Pre-Launch (Complete All Before Going Public)

**Security (MUST COMPLETE FIRST):**
- [ ] **Rate limiting** implemented and tested
  - [ ] Global rate limit: 100 requests/15min
  - [ ] Auth rate limit: 5 attempts/15min
  - [ ] API rate limit: 30 requests/min
- [ ] **Security headers** configured (helmet with CSP)
- [ ] **CORS** properly configured (allowlist only)
- [ ] **Input validation** on ALL endpoints (express-validator)
- [ ] **SQL injection** protection verified (all queries parameterized)
- [ ] **XSS protection** verified (no dangerouslySetInnerHTML, sanitized inputs)
- [ ] **Session security** (httpOnly, secure, sameSite cookies)
- [ ] **Error handling** (no stack traces to users in production)
- [ ] **Secrets management** (no hardcoded keys, using env vars)
- [ ] **npm audit** clean (no high/critical vulnerabilities)
- [ ] **Security testing** passed (SQL injection, XSS, rate limit tests)

**Infrastructure:**
- [ ] Railway project created with 3 services (DB, Backend, Frontend)
- [ ] Frontend deployed to Railway
- [ ] Backend deployed to Railway
- [ ] Database migrated to Railway PostgreSQL
- [ ] Domain configured (storyseed.com)
- [ ] SSL/HTTPS active and verified (🔒 in browser)
- [ ] Environment variables set securely in Railway
- [ ] Backups configured (Railway auto-backup enabled)
- [ ] Health check endpoint working (/health returns 200)

**Legal:**
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Cookie consent implemented (if using analytics)
- [ ] GDPR data export feature
- [ ] GDPR account deletion feature

**Payments:**
- [ ] Stripe integration complete
- [ ] Webhook handlers tested
- [ ] Subscription tiers configured
- [ ] Free tier limits enforced
- [ ] Billing portal accessible

**Monitoring:**
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (Plausible) configured
- [ ] Uptime monitoring (UptimeRobot) configured
- [ ] Health check endpoint created
- [ ] Performance monitoring active

**Testing:**
- [ ] Cross-browser testing complete
- [ ] Mobile responsiveness verified
- [ ] Critical user flows tested
- [ ] Payment flow tested
- [ ] Email delivery tested

**User Experience:**
- [ ] Onboarding flow implemented
- [ ] Loading states everywhere
- [ ] Error messages user-friendly
- [ ] Email templates polished
- [ ] Help documentation created

**SEO & Marketing:**
- [ ] Meta tags optimized
- [ ] OG image created
- [ ] Sitemap submitted
- [ ] robots.txt configured
- [ ] Google Search Console set up
- [ ] Social media accounts created
- [ ] Launch announcement prepared

### Launch Day

1. **Morning:** Final smoke test of all critical features
2. **Deploy:** Push to production during low-traffic hours
3. **Monitor:** Watch error logs, analytics, uptime
4. **Announce:** 
   - Post on ProductHunt
   - Share on Twitter/X
   - Post in relevant Reddit communities
   - Email beta users
5. **Respond:** Be active in comments, answer questions
6. **Iterate:** Quick fixes for any issues found

### Week 1 Post-Launch

- Monitor daily active users
- Collect and respond to feedback
- Fix critical bugs immediately
- Deploy improvements daily
- Reach out to power users for testimonials
- Monitor conversion rates (free → paid)

---

## Cost Breakdown (Monthly)

### Railway All-in-One Architecture

#### Minimum Viable Launch (0-100 users)
- **Railway Hosting:** $20-30 (Frontend + Backend + PostgreSQL)
- **Domain:** $1.25/month ($15/year)
- **Resend:** Free tier (3,000 emails/month)
- **Analytics:** Plausible ($9) or Umami (self-hosted free)
- **Error Tracking:** Sentry (free tier - 5,000 events/month)
- **Uptime Monitoring:** UptimeRobot (free - 50 monitors)
- **TOTAL:** ~$30-40/month ⭐

#### Growing (100-1,000 users)
- **Railway Hosting:** $50-80 (scaled resources)
- **Domain:** $1.25/month
- **Resend:** $10-20 (10,000-50,000 emails)
- **Analytics:** Plausible ($19)
- **Error Tracking:** Sentry ($26 - 50,000 events/month)
- **Redis Cache:** Railway add-on ($10)
- **TOTAL:** ~$100-130/month

#### Profitable Scale (1,000-10,000 users)
- **Railway Hosting:** $150-250 (high resources)
- **Domain:** $1.25/month
- **Resend:** $50-80 (100,000-500,000 emails)
- **Analytics:** Plausible ($69)
- **Error Tracking:** Sentry ($89)
- **Redis Cache:** Railway ($15-20)
- **Backup Storage:** Railway/S3 ($10)
- **Stripe fees:** 2.9% + $0.30 per transaction
- **TOTAL:** ~$380-500/month base + payment fees

#### Revenue Model at Scale

**At 100 paid users ($9/month):**
- Revenue: $900/month
- Costs: ~$130/month
- Stripe fees: ~$30 (100 × $0.30 + 2.9%)
- **Net profit:** ~$740/month 💰

**At 500 paid users ($9/month):**
- Revenue: $4,500/month
- Costs: ~$250/month
- Stripe fees: ~$150
- **Net profit:** ~$4,100/month 💰

**At 1,000 paid users ($9/month):**
- Revenue: $9,000/month
- Costs: ~$500/month
- Stripe fees: ~$300
- **Net profit:** ~$8,200/month 💰

### When to Consider Multi-Provider Architecture

**Stay on Railway all-in-one until:**
- 10,000+ daily active users
- 1M+ API requests/month
- Global user base needing edge CDN
- Need for serverless edge functions

**Then consider splitting:**
- **Frontend:** Vercel/Cloudflare Pages (+$20-50/month, better global CDN)
- **Backend:** Keep on Railway (proven, stable)
- **Database:** Neon/Supabase (+$25-100/month, better scaling)
- **Complexity increase:** 3x (more things to manage)
- **Cost increase:** 20-40%
- **Performance gain:** 15-30% (mostly for global users)

**Bottom line:** Railway all-in-one is cost-effective and simple until you have significant traction and revenue to justify the complexity.

---

## Resources & Tools

### Development
- **Vercel/Netlify:** Frontend hosting
- **Railway/Render:** Backend + database hosting
- **Stripe:** Payment processing
- **Resend:** Transactional email
- **Sentry:** Error tracking
- **Plausible:** Privacy-friendly analytics

### Legal
- **TermsFeed:** Generate privacy policy & TOS
- **Termly:** GDPR compliance tools
- **Privacy Policies:** https://www.privacypolicies.com/

### Marketing
- **ProductHunt:** Launch platform
- **Canva:** Design OG images & marketing materials
- **Loom:** Record tutorial videos
- **Mailchimp:** Email marketing (free tier: 500 contacts)

### Learning
- **Stripe Docs:** https://stripe.com/docs
- **Better Auth Docs:** https://www.better-auth.com/docs
- **Vercel Guides:** https://vercel.com/guides
- **Railway Docs:** https://docs.railway.app/

---

## Timeline Summary

**Week 1-2:** Infrastructure migration, security hardening
**Week 2-3:** Legal documents, GDPR compliance
**Week 3-4:** Stripe integration, monetization
**Week 4-5:** Monitoring, analytics, testing setup
**Week 5-6:** Quality assurance, automated testing
**Week 6-7:** UX polish, onboarding flow
**Week 7-8:** SEO optimization, marketing prep
**Week 8:** Soft launch to beta users
**Week 9:** Public launch!

---

## Success Metrics to Track

### Week 1
- Uptime %
- Error rate
- Page load time
- Sign-ups

### Month 1
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Conversion rate (free → paid)
- Churn rate
- Customer Acquisition Cost (CAC)

### Month 3
- Monthly Recurring Revenue (MRR)
- Lifetime Value (LTV)
- LTV:CAC ratio (aim for 3:1)
- Net Promoter Score (NPS)
- Feature usage metrics

---

## Need Help?

**Developer Communities:**
- Railway Discord: https://discord.gg/railway
- Vercel Discord: https://vercel.com/discord
- Indie Hackers: https://www.indiehackers.com/
- r/SaaS: https://reddit.com/r/SaaS

**Recommended Reading:**
- "The Mom Test" by Rob Fitzpatrick (Customer validation)
- "Traction" by Gabriel Weinberg (Marketing channels)
- "The Lean Startup" by Eric Ries (Build-Measure-Learn)

---

## Final Thoughts

You're in a great position! The core product is solid and the UI is professional. The biggest tasks ahead are:

1. **Infrastructure migration** (most critical)
2. **Legal compliance** (required for public launch)
3. **Monetization** (stripe integration)
4. **Monitoring** (so you know what's happening)

Start with Phase 1 (infrastructure) and work through systematically. Don't feel pressured to implement everything at once—many successful SaaS apps launched with much less.

The key is to launch, get real users, collect feedback, and iterate. Perfect is the enemy of shipped.

**You've got this! 🌱**

---

## Quick Reference: Security Checklist

Use this before deploying to production:

### ✅ Code Security
```bash
# 1. Check for unsafe queries
grep -r "pool.query" v2/backend --include="*.js" | grep -v "\$[0-9]"
# Should return NOTHING

# 2. Check for XSS vulnerabilities
grep -r "dangerouslySetInnerHTML" v2/src --include="*.tsx"
# Review carefully or should be empty

# 3. Check for hardcoded secrets
grep -ri "api_key\|secret\|password" v2 --include="*.js" --include="*.ts" | grep -v "process.env"
# Should return NOTHING

# 4. Run security audit
cd v2/backend && npm audit --production
cd v2 && npm audit --production
# Fix all high/critical vulnerabilities
```

### ✅ Server Configuration
```javascript
// Required in server.js:
// ✓ helmet() with CSP
// ✓ express-rate-limit on /api/ and /api/auth/
// ✓ cors() with allowlist
// ✓ express-validator on all inputs
// ✓ hpp() for parameter pollution
// ✓ Body size limits (10mb max)
// ✓ Global error handler (no stack traces in prod)
```

### ✅ Environment Variables
```bash
# Required in Railway:
NODE_ENV=production                    # ✓
DATABASE_URL=<railway-generated>       # ✓
BETTER_AUTH_SECRET=<32+ char random>   # ✓
BETTER_AUTH_URL=https://your-domain    # ✓
RESEND_API_KEY=<your-key>             # ✓
FRONTEND_URL=https://your-domain       # ✓
ALLOWED_ORIGINS=https://your-domain    # ✓
PORT=3000                              # ✓
```

### ✅ Manual Security Tests
```bash
# Test rate limiting (should get 429 after limits)
for i in {1..10}; do curl https://your-api.com/api/health; done

# Test SQL injection (should get validation error)
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "'\'' OR '\''1'\''='\''1"}'

# Test CORS (should get CORS error from unauthorized origin)
curl -H "Origin: http://evil.com" https://your-api.com/api/health

# Test HTTPS redirect (should redirect http → https)
curl -I http://your-domain.com

# Test security headers
curl -I https://your-domain.com | grep -i "x-frame-options\|x-content-type\|strict-transport"
```

### ✅ Database Security
```sql
-- Run these in Railway PostgreSQL:
-- Check that RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- All tables should have rowsecurity = true

-- Check user permissions (should NOT be superuser)
SELECT usename, usesuper FROM pg_user WHERE usename = current_user;
-- usesuper should be 'f' (false)
```

### ✅ Pre-Deployment Verification

**Last checks before `railway up`:**
- [ ] .env files are in .gitignore
- [ ] No secrets in git history
- [ ] npm audit shows 0 high/critical
- [ ] All queries use $1, $2 parameters
- [ ] Rate limiting tested locally
- [ ] Input validation on all POST/PUT/PATCH
- [ ] Error handler catches all exceptions
- [ ] HTTPS enforced (no HTTP in production)
- [ ] Session cookies are httpOnly + secure
- [ ] CSP headers configured

**If all checked ✅ → You're ready to deploy! 🚀**
