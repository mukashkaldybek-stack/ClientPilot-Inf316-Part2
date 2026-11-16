@echo off
title ClientPilot Web Server
cd /d "%~dp0"

echo ===================================================
echo   ClientPilot - Freelance Micro-SaaS Server
echo   Running at: http://localhost:3000
echo ===================================================
echo.

:: Automatically free port 3000 if previously left open
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Freeing port 3000 from old process PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

node dist/server/index.js
pause
