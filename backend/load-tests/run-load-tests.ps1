# DTMS Load Test Orchestrator
# Runs progressive load tests at 10, 50, 100, 250, 500 concurrent users.
#
# Environment variables (set before running):
#   BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, STUDENT_EMAIL, STUDENT_PASSWORD,
#   FACULTY_EMAIL, FACULTY_PASSWORD

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$ResultsDir = "results"
)

$ErrorActionPreference = "Stop"

# Ensure k6 is available
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "`n=== DTMS Load Testing ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host "Results: $ResultsDir`n"

# Create results directory
New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$vusLevels = @(10, 50, 100, 250, 500)
$duration = "60s"

$env:BASE_URL = $BaseUrl
$env:ADMIN_EMAIL = "admin@dtms.local"
$env:ADMIN_PASSWORD = "Admin@12345"
$env:STUDENT_EMAIL = "loadtest.student1@dtms.local"
$env:STUDENT_PASSWORD = "LoadTest123"
$env:FACULTY_EMAIL = "loadtest.faculty1@dtms.local"
$env:FACULTY_PASSWORD = "LoadTest123"

# Check if server is running
Write-Host "Checking server health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method GET -TimeoutSec 5
    Write-Host "Server is healthy: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Server is not running at $BaseUrl" -ForegroundColor Red
    Write-Host "Start the server first: cd backend && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

# Seed load test users
Write-Host "`nSeeding load test users..." -ForegroundColor Yellow
$env:ADMIN_EMAIL = "admin@dtms.local"
$env:ADMIN_PASSWORD = "Admin@12345"
node "load-tests\seed-load-test-users.js"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: User seeding may have partial failures" -ForegroundColor Yellow
}

# Run tests at each concurrency level
foreach ($vus in $vusLevels) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  Testing with $vus concurrent users" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Health test
    Write-Host "[1/4] Health endpoint ($vus VUs, $duration)..." -ForegroundColor Yellow
    k6 run `
        --env VUS=$vus `
        --env DURATION=$duration `
        --summary-export="$ResultsDir\health_${vus}vus_${timestamp}.json" `
        "load-tests\k6-health.js" 2>&1 | Out-String | Write-Host

    # Auth test
    Write-Host "`n[2/4] Auth flow ($vus VUs, $duration)..." -ForegroundColor Yellow
    k6 run `
        --env VUS=$vus `
        --env DURATION=$duration `
        --summary-export="$ResultsDir\auth_${vus}vus_${timestamp}.json" `
        "load-tests\k6-auth.js" 2>&1 | Out-String | Write-Host

    # Mixed workload test
    Write-Host "`n[3/4] Mixed workload ($vus VUs, $duration)..." -ForegroundColor Yellow
    k6 run `
        --env VUS=$vus `
        --env DURATION=$duration `
        --summary-export="$ResultsDir\mixed_${vus}vus_${timestamp}.json" `
        "load-tests\k6-mixed.js" 2>&1 | Out-String | Write-Host

    # Analytics test
    Write-Host "`n[4/4] Admin analytics ($vus VUs, $duration)..." -ForegroundColor Yellow
    k6 run `
        --env VUS=$vus `
        --env DURATION=$duration `
        --summary-export="$ResultsDir\analytics_${vus}vus_${timestamp}.json" `
        "load-tests\k6-analytics.js" 2>&1 | Out-String | Write-Host

    # Pause between levels
    Write-Host "`nPausing 15s before next level..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
}

Write-Host "`n=== Load testing complete ===" -ForegroundColor Green
Write-Host "Results saved to: $ResultsDir"
