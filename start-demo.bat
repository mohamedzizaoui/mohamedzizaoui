@echo off
REM Start de AVD Velgen demo en open de simulator in de browser (dubbelklik op dit bestand).
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is niet gevonden. Installeer het via https://nodejs.org en probeer opnieuw. & pause & exit /b 1)
start "" "http://localhost:8190/demo/simulator/"
echo Server draait op http://localhost:8190/demo/simulator/  (sluit dit venster om te stoppen)
node serve.mjs
pause
