/**
 * Script to update vercel.json for proper deployment
 */
const fs = require('fs');
const path = require('path');

// Path to Vercel config
const vercelConfigPath = path.join(__dirname, 'vercel.json');

// Create new Vercel configuration
const vercelConfig = {
  "version": 2,
  "builds": [
    { "src": "MCS-Sales-Boost/client/dist/**", "use": "@vercel/static" },
    { "src": "api/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/auth/login", "dest": "/api/auth-api.js" },
    { "src": "/api/auth/logout", "dest": "/api/auth-api.js" },
    { "src": "/api/auth/check", "dest": "/api/auth-api.js" },
    { "src": "/api/(.*)", "dest": "/api/$1.js" },
    { "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|ico|json|svg|woff|woff2|ttf|eot))", "dest": "/MCS-Sales-Boost/client/dist/$1" },
    { "src": "/(.*)", "dest": "/MCS-Sales-Boost/client/dist/index.html" }
  ]
};

// Write updated config to file
fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
console.log('✅ Updated vercel.json for deployment');

// Update package.json to include build command
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

// Update build script
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts.build = "cd MCS-Sales-Boost && npm install && npm run build";

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with correct build command');

// Create a PowerShell deploy script
const deployScriptPath = path.join(__dirname, 'deploy.ps1');
const deployScript = `# PowerShell script to deploy MCS Sales Boost to Vercel
Write-Host "Script starting..."

# Build the client
Write-Host "Building client..."
Set-Location -Path "MCS-Sales-Boost\\client"
npm install
npm run build

# Create dist directory if it doesn't exist
if (-not (Test-Path -Path "..\\dist")) {
    Write-Host "Creating dist directory..."
    New-Item -ItemType Directory -Path "..\\dist" -Force
}

# Copy build output to dist directory
Write-Host "Copying build files..."
Copy-Item -Path "dist\\*" -Destination "..\\dist\\" -Recurse -Force

# Return to root directory
Set-Location -Path "..\\.."

# Deploy to Vercel
Write-Host "Deploying to Vercel..."
npx vercel --prod

Write-Host "✅ Deployment completed!"
`;

fs.writeFileSync(deployScriptPath, deployScript);
console.log('✅ Created deploy.ps1 script');

console.log('\n🚀 Setup complete! Run the following command to deploy:');
console.log('  node update-vercel-config.js && .\\deploy.ps1'); 