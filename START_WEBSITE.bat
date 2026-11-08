@echo off
cd /d "%~dp0"
echo Starting AdSpot Tashkent Python Server...
start http://localhost:8000
python server.py
pause
