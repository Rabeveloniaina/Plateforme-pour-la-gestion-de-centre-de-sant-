@echo off
echo ========================================
echo   Installation de node-cron
echo ========================================
echo.

REM Vérifier si Node.js est disponible
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas dans le PATH
    pause
    exit /b 1
)

echo Installation de node-cron@^3.0.3...
echo.

REM Essayer différentes méthodes d'installation
echo [1/3] Tentative avec npm standard...
npm install node-cron@^3.0.3
if %errorlevel% equ 0 (
    echo.
    echo ✅ Installation réussie avec npm standard
    goto :success
)

echo.
echo [2/3] Tentative avec --legacy-peer-deps...
npm install node-cron@^3.0.3 --legacy-peer-deps
if %errorlevel% equ 0 (
    echo.
    echo ✅ Installation réussie avec --legacy-peer-deps
    goto :success
)

echo.
echo [3/3] Tentative avec --no-optional...
npm install node-cron@^3.0.3 --no-optional
if %errorlevel% equ 0 (
    echo.
    echo ✅ Installation réussie avec --no-optional
    goto :success
)

echo.
echo ❌ Toutes les tentatives ont échoué
echo.
echo Solutions possibles:
echo   1. Exécuter ce script en tant qu'Administrateur
echo   2. Désactiver temporairement l'antivirus
echo   3. Vérifier les permissions du dossier node_modules
echo.
pause
exit /b 1

:success
echo.
echo ========================================
echo   Vérification de l'installation
echo ========================================
npm list node-cron
echo.
echo ✅ node-cron installé avec succès!
echo.
pause

