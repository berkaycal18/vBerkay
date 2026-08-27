# MOVADROP Windows Server 1-Click Auto-Installer Script
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " 🚀 MOVADROP Windows 7/24 Otomatik Kurulum" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Open Firewall Port 3000
Write-Host "`n[1/3] Guvenlik Duvarinda Port 3000 denemesi..." -ForegroundColor Yellow
try {
    netsh advfirewall firewall add rule name="MOVADROP Port 3000" dir=in action=allow protocol=TCP localport=3000 | Out-Null
    Write-Host "✅ Port 3000 basariyla acildi." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Port 3000 uyarisi (zaten acik veya izin gerektiriyor)." -ForegroundColor Gray
}

# 2. Clone or Update repo
Write-Host "`n[2/3] MOVADROP projesi C:\movadrop dizinine indiriliyor..." -ForegroundColor Yellow
if (Test-Path "C:\movadrop") {
    Set-Location "C:\movadrop"
    try { git pull origin main } catch {}
} else {
    try {
        git clone https://github.com/berkaycal18/vBerkay.git C:\movadrop
        Set-Location "C:\movadrop"
    } catch {
        Write-Host "Git indirilemedi, zip olarak indiriliyor..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri "https://github.com/berkaycal18/vBerkay/archive/refs/heads/main.zip" -OutFile "C:\movadrop.zip"
        Expand-Archive -Path "C:\movadrop.zip" -DestinationPath "C:\" -Force
        Rename-Item -Path "C:\vBerkay-main" -NewName "movadrop" -Force
        Set-Location "C:\movadrop"
    }
}

# 3. Install & Start PM2
Write-Host "`n[3/3] Paketler kuruluyor ve 7/24 servis baslatiliyor..." -ForegroundColor Yellow
npm install
npm install -g pm2
pm2 start server.js --name "movadrop"
pm2 save

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " 🎉 KURULUM TAMAMLANDI!" -ForegroundColor Green
Write-Host " MOVADROP sunucunuzda 7/24 calisiyor." -ForegroundColor Green
Write-Host " Erisim Adresi: http://localhost:3000" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
