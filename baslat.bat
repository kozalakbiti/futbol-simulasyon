@echo off
REM Club Manager: Glory Road - yerel sunucuyu baslatir ve oyunu tarayicida acar.
REM Oyun modullere bolundugu icin index.html dosyaya cift tiklanarak (file://) acilamaz.
REM Sunucu Node.js ile calisir (sunucu.js, harici paket gerekmez).
REM --lan: sunucu yerel aga da acilir (0.0.0.0); ayni Wi-Fi'daki telefondan
REM asagida yazan http://192.168.x.x:8000 adresiyle girilebilir.
REM Yalnizca bu bilgisayar icin: "node sunucu.js 8000" (--lan olmadan).
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. https://nodejs.org adresinden Node.js kurup tekrar deneyin.
  pause
  exit /b 1
)

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8000"
node sunucu.js 8000 --lan
echo.
echo Sunucu baslatilamadi veya durdu.
pause
