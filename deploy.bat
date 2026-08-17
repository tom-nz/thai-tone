@echo off
REM STREAMING_CHUNK:Setting up batch script environment...
chcp 65001 > nul
echo ===================================================
echo   🚀 Starting Auto-Deploy to GitHub & Cloudflare
echo ===================================================
echo.

REM STREAMING_CHUNK:Prompting for commit message...
set /p commitMsg="Enter commit message (Press Enter for default): "
if "%commitMsg%"=="" set commitMsg=complete dynamic thai tone app with real AI integration

echo.
echo [1/3] Adding changes to Git...
REM STREAMING_CHUNK:Staging files with git add...
git add .

echo.
echo [2/3] Committing with message: "%commitMsg%"
REM STREAMING_CHUNK:Committing changes...
git commit -m "%commitMsg%"

echo.
echo [3/3] Pushing to GitHub...
REM STREAMING_CHUNK:Pushing repository...
git push

echo.
echo ===================================================
echo   ✅ Successfully deployed! Cloudflare is building.
echo ===================================================
echo.
pause