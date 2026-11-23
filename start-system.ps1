# Script PowerShell pour démarrer le système de gestion des centres de santé
Write-Host "🚀 Démarrage du système de gestion des centres de santé" -ForegroundColor Green
Write-Host ""

# Vérification des prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour fermer"
    exit 1
}

Write-Host ""
Write-Host "🔧 Démarrage du backend..." -ForegroundColor Yellow
Set-Location "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node complete-server.js" -WindowStyle Normal

Write-Host "⏳ Attente du démarrage du backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎨 Démarrage du frontend..." -ForegroundColor Yellow
Set-Location "..\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Système démarré avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Accès aux applications :" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Pages disponibles :" -ForegroundColor Cyan
Write-Host "   - Patients:      http://localhost:5173/patients" -ForegroundColor White
Write-Host "   - Médecins:      http://localhost:5173/medecins" -ForegroundColor White
Write-Host "   - Centres:       http://localhost:5173/centres" -ForegroundColor White
Write-Host "   - Fiches Méd.:   http://localhost:5173/fiches-medicales" -ForegroundColor White
Write-Host "   - Rendez-vous:   http://localhost:5173/rendez-vous" -ForegroundColor White
Write-Host "   - Prescriptions: http://localhost:5173/prescriptions" -ForegroundColor White
Write-Host "   - Vaccinations:  http://localhost:5173/vaccinations" -ForegroundColor White
Write-Host "   - Médicaments:   http://localhost:5173/medicaments" -ForegroundColor White
Write-Host "   - Notifications: http://localhost:5173/notifications" -ForegroundColor White
Write-Host "   - Utilisateurs:  http://localhost:5173/utilisateurs" -ForegroundColor White
Write-Host ""
Write-Host "💡 Appuyez sur Entrée pour fermer cette fenêtre..." -ForegroundColor Yellow
Read-Host
