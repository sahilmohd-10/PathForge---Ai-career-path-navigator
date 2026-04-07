# Adzuna Integration Setup Script (PowerShell)
# This script helps set up and test the Adzuna API integration

Write-Host "🚀 Adzuna API Integration Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if database exists
if (-not (Test-Path "database.sqlite")) {
    Write-Host "📦 Creating database..." -ForegroundColor Yellow
    npm run seed
} else {
    Write-Host "✅ Database already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 Testing Adzuna API Integration" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Make sure server is running
$serverRunning = $false
try {
    $null = Invoke-WebRequest -Uri "http://localhost:5000/api/jobs" -TimeoutSec 1
    $serverRunning = $true
} catch {
    Write-Host "⚠️  Server is not running. Start it with: npm run dev" -ForegroundColor Yellow
    Write-Host ""
}

if ($serverRunning) {
    # Test 1: Fetch jobs from Adzuna (US)
    Write-Host "Test 1: Fetching jobs from Adzuna (US)..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/jobs?source=adzuna&country=us&limit=5" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        Write-Host "✅ Successfully fetched $($json.total) jobs" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 2: Search for specific jobs
    Write-Host ""
    Write-Host "Test 2: Searching for 'Python Developer' jobs..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/jobs/search?keywords=Python%20Developer&limit=3" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        Write-Host "✅ Successfully found $($json.total) jobs" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 3: Fetch jobs from different countries
    Write-Host ""
    Write-Host "Test 3: Fetching jobs from UK (gb)..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/jobs?source=adzuna&country=gb&limit=3" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        Write-Host "✅ Successfully fetched $($json.total) jobs" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 For more information, see ADZUNA_API_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the server: npm run dev" -ForegroundColor White
Write-Host "2. Run this script to test the API" -ForegroundColor White
Write-Host "3. Visit http://localhost:5173 to see the app" -ForegroundColor White
Write-Host ""
