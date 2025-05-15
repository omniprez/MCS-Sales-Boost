@echo off
echo Checking database tables...
node --experimental-modules server/scripts/check-db-tables.js
echo Done.
pause
