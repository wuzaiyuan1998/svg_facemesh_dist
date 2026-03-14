@echo off
cls
echo ============================================================
echo   FaceMesh Renderer Server
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

:: Start renderer server
echo Starting Renderer Server...
echo.
node renderer\renderer-server.js

pause
