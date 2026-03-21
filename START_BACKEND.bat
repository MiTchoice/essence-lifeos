@echo off
title ESSENCE Backend Server
color 0A
echo.
echo  ==========================================
echo    ESSENCE Backend  ^|  NIT Hamirpur
echo  ==========================================
echo.

:: Kill anything on port 5000 first
echo  [1/3] Freeing port 5000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000 "') do (
  taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Go to backend folder
echo  [2/3] Installing packages...
cd /d "%~dp0backend"
call npm install --silent 2>nul

:: Start server
echo  [3/3] Starting server...
echo.
echo  Backend running at: http://localhost:5000
echo  Press Ctrl+C to stop
echo  ==========================================
echo.
call npm run dev

pause
