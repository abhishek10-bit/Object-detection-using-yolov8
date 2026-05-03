@echo off
TITLE YOLOv8 Project Cleanup

cd /d "%~dp0"

echo Cleaning up old/redundant files and directories...

:: Remove the useless 2-epoch model
if exist "models\coco8_run" rmdir /s /q "models\coco8_run"

:: Remove the tiny 8-image test dataset
if exist "datasets" rmdir /s /q "datasets"

:: Remove synthetic shapes data and related scripts
if exist "data" rmdir /s /q "data"
if exist "scripts\generate_synthetic_data.py" del /q "scripts\generate_synthetic_data.py"
if exist "scripts\train.py" del /q "scripts\train.py"

:: Remove redundant scripts (Streamlit covers these features now)
if exist "scripts\download_coco.py" del /q "scripts\download_coco.py"
if exist "scripts\webcam_inference.py" del /q "scripts\webcam_inference.py"

:: Remove the duplicate start script from the parent folder
if exist "..\start_yolo_app.bat" del /q "..\start_yolo_app.bat"

echo.
echo Cleanup complete! Your project is now sleek and minimal.
echo (You can delete this cleanup.bat file now too if you want)
pause
