# MOVADROP Windows Server 1-Click Auto-Installer Script
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " 🚀 MOVADROP Windows 7/24 Otomatik Kurulum" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Open Firewall Port 3000
Write-Host "`n[1/3] Guvenlik Duvarinda Port 3000 aciliyor..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "MOVADROP Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ Port 3000 basariyla acildi." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Port 3000 uyarisi (zaten acik olabilir)." -ForegroundColor Gray
}

# 2. Clone or Update repo
Write-Host "`n[2/3] MOVADROP projesi C:\movadrop dizinine indiriliyor..." -ForegroundColor Yellow
if (Test-Path "C:\movadrop") {
    Set-Location "C:\movadrop"
    git pull origin main
} else {
    git clone https://github.com/berkaycal18/vBerkay.git C:\movadrop
    Set-Location "C:\movadrop"
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
