@echo off
title ESSENCE Frontend App
color 0B
echo.
echo  ==========================================
echo    ESSENCE Frontend  ^|  NIT Hamirpur
echo  ==========================================
echo.
echo  IMPORTANT: Start backend FIRST!
echo  (Run START_BACKEND.bat in another window)
echo.
echo  [1/2] Installing packages...
cd /d "%~dp0frontend"
call npm install --silent 2>nul

echo  [2/2] Starting app...
echo.
echo  App will open at: http://localhost:3000
echo  ==========================================
echo.
call npm run dev

pause
