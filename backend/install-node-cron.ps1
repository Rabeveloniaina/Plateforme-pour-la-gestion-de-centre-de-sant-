# Script PowerShell pour installer node-cron
# Exécuter en Administrateur si erreur EACCES

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installation de node-cron" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est en Administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Attention: PowerShell n'est pas exécuté en Administrateur" -ForegroundColor Yellow
    Write-Host "   Si erreur EACCES, fermer et relancer en Administrateur" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continuer quand même? (O/N)"
    if ($continue -ne "O" -and $continue -ne "o" -and $continue -ne "Y" -and $continue -ne "y") {
        Write-Host "Installation annulée." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "🧹 Nettoyage du cache npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null

Write-Host ""
Write-Host "📦 Installation de node-cron@^3.0.3..." -ForegroundColor Cyan
Write-Host ""

# Méthode 1: Installation standard
Write-Host "[1/4] Tentative avec npm standard..." -ForegroundColor Yellow
$result1 = npm install node-cron@^3.0.3 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Installation réussie avec npm standard!" -ForegroundColor Green
    goto :verify
}

# Méthode 2: Avec legacy-peer-deps
Write-Host "[2/4] Tentative avec --legacy-peer-deps..." -ForegroundColor Yellow
$result2 = npm install node-cron@^3.0.3 --legacy-peer-deps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Installation réussie avec --legacy-peer-deps!" -ForegroundColor Green
    goto :verify
}

# Méthode 3: Avec no-optional
Write-Host "[3/4] Tentative avec --no-optional..." -ForegroundColor Yellow
$result3 = npm install node-cron@^3.0.3 --no-optional 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Installation réussie avec --no-optional!" -ForegroundColor Green
    goto :verify
}

# Méthode 4: Avec --force
Write-Host "[4/4] Tentative avec --force..." -ForegroundColor Yellow
$result4 = npm install node-cron@^3.0.3 --force 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Installation réussie avec --force!" -ForegroundColor Green
    goto :verify
}

Write-Host ""
Write-Host "❌ Toutes les tentatives ont échoué" -ForegroundColor Red
Write-Host ""
Write-Host "Solutions:" -ForegroundColor Yellow
Write-Host "  1. Exécuter PowerShell en Administrateur:" -ForegroundColor White
Write-Host "     - Clic droit sur PowerShell" -ForegroundColor White
Write-Host "     - 'Exécuter en tant qu'administrateur'" -ForegroundColor White
Write-Host "  2. Vérifier l'antivirus (peut bloquer npm)" -ForegroundColor White
Write-Host "  3. Vérifier les permissions du dossier node_modules" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entrée pour fermer"
exit 1

:verify
Write-Host ""
Write-Host "🔍 Vérification de l'installation..." -ForegroundColor Cyan
npm list node-cron --depth=0

Write-Host ""
Write-Host "✅ Installation terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Démarrer le backend: npm start" -ForegroundColor White
Write-Host "   2. Vérifier que le scheduler démarre correctement" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entrée pour fermer"

