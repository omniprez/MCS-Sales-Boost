@echo off
echo Fixing duplicate installations...
node server/scripts/fix-duplicate-installations.cjs
echo Done.
pause
