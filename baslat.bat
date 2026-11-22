@echo off
REM Club Manager: Glory Road - yerel sunucuyu baslatir ve oyunu tarayicida acar.
REM Oyun modullere bolundugu icin index.html dosyaya cift tiklanarak (file://) acilamaz.
REM Sunucu Node.js ile calisir (sunucu.js, harici paket gerekmez).
REM Sunucu yalnizca bu bilgisayara (127.0.0.1) acilir, yerel agdan erisilemez.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. https://nodejs.org adresinden Node.js kurup tekrar deneyin.
  pause
  exit /b 1
)

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8000"
node sunucu.js 8000
echo.
echo Sunucu baslatilamadi veya durdu.
pause
