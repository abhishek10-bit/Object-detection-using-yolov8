@echo off
TITLE YOLOv8 Application Launcher

:: Navigate to the directory containing the batch script
cd /d "%~dp0"

echo =========================================
echo Starting YOLOv8 Object Detection Services
echo =========================================
echo.

echo [1/2] Starting FastAPI Backend server...
:: Open a new command window for the backend
start "YOLOv8 Backend (FastAPI)" cmd /k "python backend\main.py"

echo Waiting a few seconds for the backend to initialize...
ping 127.0.0.1 -n 6 > nul

echo [2/2] Starting Streamlit Frontend UI...
:: Open a new command window for the frontend
start "YOLOv8 Frontend (Streamlit)" cmd /k "streamlit run frontend\app.py"

echo.
echo =========================================
echo Both services are starting up! 
echo Your browser will open the UI automatically.
echo =========================================
