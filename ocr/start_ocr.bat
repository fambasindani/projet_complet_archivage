@echo off
cd /d "%~dp0"
echo Demarrage du service OCR sur http://127.0.0.1:5000
python app.py
pause
