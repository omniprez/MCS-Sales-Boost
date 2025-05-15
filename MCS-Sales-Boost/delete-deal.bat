@echo off
echo SalesSpark Deal Deletion Utility
echo ==============================
echo.

if "%1"=="" (
  echo Please provide a deal ID
  echo Usage: delete-deal.bat [deal_id]
  exit /b 1
)

echo Attempting to delete deal with ID: %1
echo.

node scripts/delete-deal.js %1

if %ERRORLEVEL% EQU 0 (
  echo.
  echo Deal deletion completed successfully
) else (
  echo.
  echo Deal deletion failed
)

pause
