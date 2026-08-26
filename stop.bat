@echo off
title AetherDrop Durdurucu
echo AetherDrop arka plan sunucusu kapatiliyor...
taskkill /f /im node.exe
taskkill /f /im cloudflared.exe
echo Basariyla durduruldu!
pause
