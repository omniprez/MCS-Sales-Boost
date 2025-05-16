#!/bin/bash
# Script to build React frontend, copy to public, and push to Git
set -e

# Step 1: Build the React app
cd MCS-Sales-Boost/client
npm install
npm run build

# Step 2: Copy build output to root public directory
rm -rf ../public/*
cp -r dist/* ../public/

# Step 3: Commit and push
cd ../..
git add .
git commit -m "chore: automated deploy of React frontend to public for Vercel"
git push

echo "✅ Frontend built, copied to public, and pushed to Git. Trigger a Vercel redeploy if not automatic." 