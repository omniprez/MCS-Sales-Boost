#!/bin/bash
# Script to deploy MCS Sales Boost to Vercel
set -e

# Build the client
echo "Building client..."
cd MCS-Sales-Boost/client
npm install
npm run build

# Create dist directory if it doesn't exist
mkdir -p ../dist

# Copy build output to dist directory
echo "Copying build files..."
cp -r dist/* ../dist/

# Return to root directory
cd ../..

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
