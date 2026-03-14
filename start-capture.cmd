@echo off
cls
echo ============================================================
echo   FaceMesh Capture Server
echo ============================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js not found.
    pause
    exit /b 1
)

:: Check dependencies
if not exist "node_modules\ws" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
    echo Dependencies installed.
    echo.
)

:: Start capture server
echo Starting Capture Server...
echo.
node capture\capture-server.js

pause
