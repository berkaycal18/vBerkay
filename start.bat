@echo off
title AetherDrop - PC to Phone Teleport Platform
echo ======================================================
echo    🛸 AetherDrop Platformu Baslatiliyor...
echo ======================================================
echo.

if not exist node_modules (
  echo [1/2] Bagimliliklar yukleniyor...
  call npm install
)

echo [2/2] Sunucu calistiriliyor...
node server.js --tunnel
pause
