@echo off
TITLE VisionAI Application Launcher

cd /d "%~dp0"

echo =========================================
echo Setting up and starting VisionAI
echo =========================================
echo.

echo [1/3] Installing missing frontend dependencies...
cd client
call npm install
cd ..

echo [2/3] Starting FastAPI Backend server...
start "VisionAI Backend" cmd /k "cd yolov8_project && python backend\main.py"

echo Waiting a few seconds for the backend to initialize...
ping 127.0.0.1 -n 6 > nul

echo [3/3] Starting React Frontend...
start "VisionAI Frontend" cmd /k "cd client && npm run dev"

echo.
echo =========================================
echo Success! Both services are starting up. 
echo Make sure to open http://localhost:5173 in your browser!
echo =========================================
pause
