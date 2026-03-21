@echo off
title LifeOS Seed Data
color 0E
echo.
echo  ==========================================
echo   LifeOS  ^|  Loading Sample Data
echo  ==========================================
echo.
cd /d "%~dp0backend"
if not exist "node_modules" (
    echo [Installing dependencies first...]
    call npm install
)
node seed.js
echo.
pause
