@echo off
chcp 65001 >nul
echo ======================================================
echo   Auto Deploying to GitHub and Cloudflare Pages
echo ======================================================
echo.

set /p commitMsg="Enter commit message (Press Enter for default): "
if "%commitMsg%"=="" set commitMsg=complete dynamic thai tone app with real AI integration

echo.
echo [1/4] Adding changes to Git...
git add .

echo.
echo [2/4] Committing with message: "%commitMsg%"
git commit -m "%commitMsg%"

echo.
echo [3/4] Pulling latest changes to prevent conflict...
git pull origin main --rebase

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ======================================================
echo   Successfully deployed! Cloudflare is building.
echo ======================================================
echo.
pause