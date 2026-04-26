@echo off
echo === Cleaning up old project folders ===
echo.

echo Deleting C:\Users\Zara\question-bank ...
rmdir /s /q "C:\Users\Zara\question-bank" 2>nul
if not exist "C:\Users\Zara\question-bank" (
    echo   [OK] Deleted.
) else (
    echo   [SKIP] Still locked. Close VS Code and retry.
)

echo Deleting C:\Users\Zara\.antigravity\Question_bank ...
rmdir /s /q "C:\Users\Zara\.antigravity\Question_bank" 2>nul
if not exist "C:\Users\Zara\.antigravity\Question_bank" (
    echo   [OK] Deleted.
) else (
    echo   [SKIP] Still locked. Close VS Code and retry.
)

echo.
echo === Done. You can delete this script now. ===
pause
