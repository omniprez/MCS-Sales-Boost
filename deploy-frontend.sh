#!/bin/bash
# Script to build React frontend and deploy to Vercel
set -e

# Step 1: Build the React app
cd MCS-Sales-Boost/client
npm install
npm run build

# Step 2: Ensure output directory exists
mkdir -p ../dist

# Step 3: Copy build output to dist directory
cp -r dist/* ../dist/

# Step 4: Run Vercel deploy
cd ../..
echo "✅ Frontend built successfully."
echo "🚀 Run 'vercel --prod' to deploy to production." 