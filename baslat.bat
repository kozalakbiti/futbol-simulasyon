@echo off
REM Club Manager: Glory Road - yerel sunucuyu baslatir ve oyunu tarayicida acar.
REM Oyun modullere bolundugu icin index.html dosyaya cift tiklanarak (file://) acilamaz.
REM Sunucu yalnizca bu bilgisayara (127.0.0.1) acilir, yerel agdan erisilemez.
cd /d "%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY (
  python --version >nul 2>nul && set "PY=python"
)
if not defined PY (
  echo Python bulunamadi. https://www.python.org adresinden Python 3 kurup tekrar deneyin.
  pause
  exit /b 1
)

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8000"
echo Oyun http://127.0.0.1:8000 adresinde calisiyor. Kapatmak icin bu pencereyi kapatin.
%PY% -m http.server 8000 --bind 127.0.0.1
echo.
echo Sunucu baslatilamadi veya durdu. 8000 portu baska bir program tarafindan kullaniliyor olabilir.
pause
