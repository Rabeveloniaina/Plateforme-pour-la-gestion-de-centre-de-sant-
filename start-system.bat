@echo off
echo 🚀 Démarrage du système de gestion des centres de santé
echo.

echo 📋 Vérification des prérequis...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    pause
    exit /b 1
)
echo ✅ Node.js détecté

echo.
echo 🔧 Démarrage du backend...
cd backend
start "Backend Server" cmd /k "node complete-server.js"

echo ⏳ Attente du démarrage du backend...
timeout /t 5 /nobreak >nul

echo.
echo 🎨 Démarrage du frontend...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Système démarré avec succès !
echo.
echo 📱 Accès aux applications :
echo    Backend API: http://localhost:3000
echo    Frontend:    http://localhost:5173
echo.
echo 🎯 Pages disponibles :
echo    - Patients:      http://localhost:5173/patients
echo    - Médecins:      http://localhost:5173/medecins
echo    - Centres:       http://localhost:5173/centres
echo    - Fiches Méd.:   http://localhost:5173/fiches-medicales
echo    - Rendez-vous:   http://localhost:5173/rendez-vous
echo    - Prescriptions: http://localhost:5173/prescriptions
echo    - Vaccinations:  http://localhost:5173/vaccinations
echo    - Médicaments:   http://localhost:5173/medicaments
echo    - Notifications: http://localhost:5173/notifications
echo    - Utilisateurs:  http://localhost:5173/utilisateurs
echo.
echo 💡 Appuyez sur une touche pour fermer cette fenêtre...
pause >nul
