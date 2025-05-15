@echo off
echo Setting up Git repository...

echo Configuring Git user...
git config --global user.email "rishman1602@gmail.com"
git config --global user.name "omniprez"

echo Initializing Git repository...
git init

echo Adding all files to Git...
git add .

echo Committing files...
git commit -m "Initial commit of SalesSpark project"

echo Adding remote repository...
git remote add origin https://github.com/omniprez/MCS-Sales-Boost.git

echo Creating main branch...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo Done!
pause
