# PowerShell script to deploy MCS Sales Boost to Vercel
Write-Host "Script starting..."

# Build the client
Write-Host "Building client..."
Set-Location -Path "MCS-Sales-Boost\client"
npm install
npm run build

# Create dist directory if it doesn't exist
if (-not (Test-Path -Path "..\dist")) {
    Write-Host "Creating dist directory..."
    New-Item -ItemType Directory -Path "..\dist" -Force
}

# Copy build output to dist directory
Write-Host "Copying build files..."
Copy-Item -Path "dist\*" -Destination "..\dist\" -Recurse -Force

# Return to root directory
Set-Location -Path "..\.."

# Deploy to Vercel
Write-Host "Deploying to Vercel..."
npx vercel --prod

Write-Host "✅ Deployment completed!"
