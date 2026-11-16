@echo off
title ClientPilot Web Server
cd /d "%~dp0"
echo ===================================================
echo   ClientPilot - Freelance Micro-SaaS Server
echo   Running at: http://localhost:3000
echo ===================================================
echo.
node dist/server/index.js
pause
