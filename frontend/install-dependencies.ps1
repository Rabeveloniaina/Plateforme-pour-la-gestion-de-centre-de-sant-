# Script PowerShell pour installer les dépendances frontend
# Exécuter en Administrateur si erreur EACCES

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installation Dépendances Frontend" -ForegroundColor Cyan
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
Write-Host "📦 Installation des dépendances..." -ForegroundColor Cyan
Write-Host ""

# Installer une par une
$packages = @(
    @{name="recharts"; version="^2.15.0"},
    @{name="react-big-calendar"; version="^1.15.0"},
    @{name="date-fns"; version="^4.1.0"}
)

foreach ($pkg in $packages) {
    Write-Host "📦 Installation de $($pkg.name)..." -ForegroundColor Yellow
    
    # Méthode 1: Standard
    $result = npm install "${pkg.name}@${pkg.version}" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $($pkg.name) installé!" -ForegroundColor Green
        continue
    }
    
    # Méthode 2: Legacy peer deps
    Write-Host "   Tentative avec --legacy-peer-deps..." -ForegroundColor Yellow
    $result = npm install "${pkg.name}@${pkg.version}" --legacy-peer-deps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $($pkg.name) installé!" -ForegroundColor Green
        continue
    }
    
    # Méthode 3: Force
    Write-Host "   Tentative avec --force..." -ForegroundColor Yellow
    $result = npm install "${pkg.name}@${pkg.version}" --force 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $($pkg.name) installé!" -ForegroundColor Green
        continue
    }
    
    Write-Host "❌ Échec installation de $($pkg.name)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Vérification de l'installation..." -ForegroundColor Cyan
npm list recharts react-big-calendar date-fns --depth=0

Write-Host ""
Write-Host "✅ Installation terminée!" -ForegroundColor Green
Write-Host ""
Read-Host "Appuyez sur Entrée pour fermer"

