# Script de démarrage complet du système NINSANP
# Démarre le backend et le frontend en parallèle

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DÉMARRAGE SYSTÈME NINSANP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier si les dossiers existent
if (-not (Test-Path "backend")) {
    Write-Host "❌ Le dossier backend n'existe pas" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "❌ Le dossier frontend n'existe pas" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  Note: Si des dépendances manquent, installez-les avec:" -ForegroundColor Yellow
Write-Host "   Backend:  cd backend && npm install" -ForegroundColor Yellow
Write-Host "   Frontend: cd frontend && npm install" -ForegroundColor Yellow
Write-Host ""

# Demander confirmation
$confirmation = Read-Host "Voulez-vous démarrer les serveurs maintenant? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o" -and $confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "Démarrage annulé." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Démarrage du backend sur le port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "🚀 Démarrage du frontend sur le port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Serveurs démarrés!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 URLs disponibles:" -ForegroundColor Cyan
Write-Host "   - Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   - Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Pour arrêter les serveurs, fermez les fenêtres PowerShell ou utilisez Ctrl+C" -ForegroundColor Yellow
Write-Host ""

