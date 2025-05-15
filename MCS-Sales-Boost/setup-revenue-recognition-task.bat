@echo off
echo Setting up daily revenue recognition verification task...

REM Get the current directory
set SCRIPT_DIR=%~dp0
set SCRIPT_PATH=%SCRIPT_DIR%server\scheduled-tasks\ensure-revenue-recognition.js

REM Create the scheduled task
schtasks /create /tn "SalesSpark Revenue Recognition Verification" /tr "node %SCRIPT_PATH%" /sc daily /st 01:00 /ru SYSTEM /f

echo Task created successfully. It will run daily at 1:00 AM.
echo You can modify the task in Task Scheduler if needed.
pause
