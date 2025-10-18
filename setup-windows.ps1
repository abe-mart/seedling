# Windows Development Setup Script
# Run this in PowerShell to set up the development environment

Write-Host "🚀 Setting up Seedling development environment..." -ForegroundColor Green

# Check Node.js installation
Write-Host "`nChecking Node.js installation..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm installation
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed!" -ForegroundColor Red
    exit 1
}

# Check if .env exists
Write-Host "`nChecking environment configuration..." -ForegroundColor Cyan
if (!(Test-Path ".env")) {
    Write-Host ".env file not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env with your Supabase credentials before continuing!" -ForegroundColor Yellow
    Write-Host "   Run: notepad .env" -ForegroundColor Yellow
    
    $continue = Read-Host "`nHave you configured .env? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please configure .env and run this script again." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "`nInstalling Node.js dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Run type check
Write-Host "`nRunning TypeScript type check..." -ForegroundColor Cyan
npm run typecheck

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Type check passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Type check found issues (this is okay for initial setup)" -ForegroundColor Yellow
}

# Test build
Write-Host "`nTesting production build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your Supabase project is configured" -ForegroundColor White
Write-Host "2. Run database migrations in Supabase SQL Editor" -ForegroundColor White
Write-Host "3. Start development server: npm run dev" -ForegroundColor White
Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  npm run dev      - Start development server" -ForegroundColor White
Write-Host "  npm run build    - Build for production" -ForegroundColor White
Write-Host "  npm run preview  - Preview production build" -ForegroundColor White
Write-Host "  npm run lint     - Run linter" -ForegroundColor White
