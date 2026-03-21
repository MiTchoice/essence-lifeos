@echo off
title LifeOS Frontend
color 0B
echo.
echo  ==========================================
echo   LifeOS Frontend  ^|  NIT Hamirpur
echo   Opens at: http://localhost:3000
echo  ==========================================
echo.
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [Installing frontend dependencies...]
    call npm install
    if errorlevel 1 ( echo ERROR: npm install failed & pause & exit /b 1 )
)
echo [Starting frontend on http://localhost:3000]
echo [Press Ctrl+C to stop]
echo.
call npm run dev
pause
