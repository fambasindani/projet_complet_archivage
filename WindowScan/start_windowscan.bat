@echo off
cd /d "%~dp0"

if exist "bin\Debug\WindowScan.exe" (
  start "" "bin\Debug\WindowScan.exe"
  exit /b 0
)

if exist "bin\Release\WindowScan.exe" (
  start "" "bin\Release\WindowScan.exe"
  exit /b 0
)

echo WindowScan.exe introuvable. Compilez le projet Visual Studio d'abord.
pause
