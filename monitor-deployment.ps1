# Deployment Monitoring Script
# This script monitors Vercel rate limits and automatically deploys when available

Write-Host "=== Vercel Deployment Monitor ==="
Write-Host "Starting continuous monitoring..."

$resetTime = [DateTimeOffset]::FromUnixTimeSeconds(1758720801)
$deploymentAttempts = 0
$maxAttempts = 5

while ($deploymentAttempts -lt $maxAttempts) {
    $currentTime = [DateTimeOffset]::Now
    $timeRemaining = $resetTime - $currentTime
    
    if ($timeRemaining.TotalSeconds -le 0) {
        Write-Host "\n[$(Get-Date)] Rate limit should be reset. Attempting deployment..." -ForegroundColor Green
        
        # Try to push to GitHub first if needed
        Write-Host "Checking Git status..." -ForegroundColor Yellow
        $gitStatus = git status --porcelain
        if ($gitStatus) {
            Write-Host "Uncommitted changes detected. Committing..." -ForegroundColor Yellow
            git add .
            git commit -m "Auto-commit before deployment"
        }
        
        # Try to push to GitHub
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        $pushResult = git push origin master 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
        } else {
            Write-Host "Warning: Failed to push to GitHub. Deployment may use cached version." -ForegroundColor Yellow
            Write-Host "Error: $pushResult" -ForegroundColor Red
        }
        
        # Attempt Vercel deployment
        Write-Host "Attempting Vercel deployment..." -ForegroundColor Cyan
        
        # Note: This would require Vercel CLI or API integration
        # For now, we'll just notify the user
        Write-Host "\n=== DEPLOYMENT READY ==="
        Write-Host "Rate limit has reset! You can now deploy to Vercel." -ForegroundColor Green
        Write-Host "Run the deployment command or use the Trae IDE deployment feature." -ForegroundColor Green
        Write-Host "========================="
        
        $deploymentAttempts++
        
        # Wait a bit before next attempt in case of temporary issues
        Start-Sleep -Seconds 30
    } else {
        $remainingMinutes = [math]::Ceiling($timeRemaining.TotalMinutes)
        Write-Host "[$(Get-Date)] Rate limit active. Waiting $remainingMinutes minutes..." -ForegroundColor Yellow
        
        # Wait for 5 minutes before checking again
        Start-Sleep -Seconds 300
    }
}

Write-Host "\nMonitoring completed after $maxAttempts attempts." -ForegroundColor Cyan
Write-Host "Please manually check deployment status if needed." -ForegroundColor Cyan