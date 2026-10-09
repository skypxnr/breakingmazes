@echo off
echo.
echo  ============================================
echo   BREAKING MAZES - LOCAL PREVIEW
echo  ============================================
echo.
echo  Starting server...
echo  Open your browser to:  http://localhost:5000
echo.
echo  Press Ctrl+C to stop.
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  start http://localhost:5000
  python -m http.server 5000
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  start http://localhost:5000
  npx --yes serve -l 5000
  goto :eof
)

echo  Neither Python nor Node.js is installed.
echo  Install Python from python.org (takes 2 min), then run this again.
pause