# Start SharedPad Client (H5)

Write-Host "Starting SharedPad Client..." -ForegroundColor Green

# Navigate to client directory
Set-Location -Path "$PSScriptRoot\client"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the client
Write-Host "Client starting..." -ForegroundColor Cyan
npm run dev:h5
