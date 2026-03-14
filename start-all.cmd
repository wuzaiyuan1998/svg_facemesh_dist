@echo off
cls
echo ============================================================
echo   FaceMesh  -  
echo ============================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js not found. Please install Node.js first.
    echo Download: https://nodejs.org/
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
start "FaceMesh Capture" cmd /k "node capture\capture-server.js"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Start renderer server
echo Starting Renderer Server...
start "FaceMesh Renderer" cmd /k "node renderer\renderer-server.js"

echo.
echo ============================================================
echo Servers started successfully!
echo ============================================================
echo.
echo Access URLs:
echo   Capture:  http://localhost:16666/capture.html
echo   Renderer: http://localhost:16667/
echo.
echo WebSocket: ws://localhost:16666/ws
echo.
echo Press any key to close this window...
echo ============================================================
pause >nul
