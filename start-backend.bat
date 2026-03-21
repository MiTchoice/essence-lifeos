@echo off
title LifeOS Backend
color 0A
echo.
echo  ==========================================
echo   LifeOS Backend  ^|  NIT Hamirpur
echo   Mitrasen Yadav, Ashish Garg, Anshul Thakur
echo  ==========================================
echo.
cd /d "%~dp0backend"
if not exist "node_modules" (
    echo [Installing backend dependencies...]
    call npm install
    if errorlevel 1 ( echo ERROR: npm install failed & pause & exit /b 1 )
)
echo [Starting backend on http://localhost:5000]
echo [Press Ctrl+C to stop]
echo.
call npm run dev
pause
