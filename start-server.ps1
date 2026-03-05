# Start SharedPad Server

Write-Host "Starting SharedPad Server..." -ForegroundColor Green

# Navigate to server directory
Set-Location -Path "$PSScriptRoot\server"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "Server starting on http://localhost:3030" -ForegroundColor Cyan
npm run dev
