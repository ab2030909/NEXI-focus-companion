@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo   NEXI Focus Companion - Standalone Production Build Script
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/5] Checking Python and PyInstaller environment...
where pyinstaller >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Users\Abdullah\miniconda3\Scripts\pyinstaller.exe" (
        set "PYINSTALLER=C:\Users\Abdullah\miniconda3\Scripts\pyinstaller.exe"
    ) else (
        echo [ERROR] PyInstaller not found. Please run 'pip install pyinstaller'.
        exit /b 1
    )
) else (
    set "PYINSTALLER=pyinstaller"
)

echo Using PyInstaller: %PYINSTALLER%
echo.

echo [2/5] Cleaning previous build artifacts...
if exist "build" rd /s /q "build"
if exist "dist" rd /s /q "dist"
echo Clean completed.
echo.

echo [3/5] Compiling NEXI standalone Windows executable...
"%PYINSTALLER%" --clean --noconfirm NEXI.spec
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] PyInstaller compilation failed!
    exit /b %errorlevel%
)
echo.

echo [4/5] Preparing Release Package...
if not exist "release\NEXI-v1.0.0" mkdir "release\NEXI-v1.0.0"

if not exist "dist\NEXI.exe" (
    echo [ERROR] Compiled binary dist\NEXI.exe was not found!
    exit /b 1
)

copy /y "dist\NEXI.exe" "release\NEXI-v1.0.0\NEXI.exe" >nul
copy /y "VERSION" "release\NEXI-v1.0.0\VERSION.txt" >nul

if exist "focus_companion\browser_extension" (
    xcopy /e /i /y "focus_companion\browser_extension" "release\NEXI-v1.0.0\browser_extension" >nul
)

echo [5/5] Generating End-User Instructions and SHA256 Checksum...
(
    echo NEXI Focus Companion - v1.0.0
    echo ==============================
    echo.
    echo Getting Started:
    echo 1. Double-click NEXI.exe to launch the application.
    echo 2. The companion will run smoothly in your Windows notification tray and desktop.
    echo 3. To optionally enable full browser tab tracking, load the included 'browser_extension'
    echo    folder into Chrome, Edge, or Brave via Developer Mode ^(chrome://extensions^).
    echo.
    echo All productivity metrics and settings are stored locally on your PC in:
    echo %%APPDATA%%\FocusCompanion\focus_companion.db
) > "release\NEXI-v1.0.0\README.txt"

powershell -Command "Get-FileHash -Algorithm SHA256 'release\NEXI-v1.0.0\NEXI.exe' | Format-List | Out-File 'release\NEXI-v1.0.0\checksum.sha256.txt'"
powershell -Command "Compress-Archive -Path 'release\NEXI-v1.0.0\*' -DestinationPath 'release\NEXI-v1.0.0-windows-x64.zip' -Force"

echo.
echo ==============================================================================
echo   Build Successful!
echo   Executable: release\NEXI-v1.0.0\NEXI.exe
echo   ZIP Archive: release\NEXI-v1.0.0-windows-x64.zip
echo ==============================================================================
exit /b 0
