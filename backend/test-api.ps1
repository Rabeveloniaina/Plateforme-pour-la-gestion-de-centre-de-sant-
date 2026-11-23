# Script de test réel de l'API
# Tests toutes les fonctionnalités principales

$API_URL = "http://localhost:3000/api"
$token = $null
$passed = 0
$failed = 0
$tests = @()

# Fonction helper pour les tests
function Test-API {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    Write-Host "`n🧪 Test: $Name" -ForegroundColor Cyan
    try {
        & $TestBlock
        $script:passed++
        $script:tests += [PSCustomObject]@{ Name = $Name; Status = "✅ PASS" }
        Write-Host "✅ PASS: $Name" -ForegroundColor Green
    }
    catch {
        $script:failed++
        $script:tests += [PSCustomObject]@{ Name = $Name; Status = "❌ FAIL: $($_.Exception.Message)" }
        Write-Host "❌ FAIL: $Name" -ForegroundColor Red
        Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 1. Test Health
Test-API "1. Health check de l'API" {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    if ($response.status -ne "ok") {
        throw "API non disponible"
    }
    Write-Host "   API disponible: $($response.status)" -ForegroundColor Gray
}

# 2. Test Login
Test-API "2. Login médecin (POST /auth/login)" {
    $body = @{
        nom_utilisateur = "medecin1"
        mot_de_passe = "medecin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    
    if (-not $response.success -or -not $response.token) {
        throw "Login échoué: $($response.message)"
    }
    
    $script:token = $response.token
    Write-Host "   Token obtenu: Oui" -ForegroundColor Gray
    Write-Host "   Utilisateur: $($response.user.nom) ($($response.user.role))" -ForegroundColor Gray
}

# 3. Test Auth Me
Test-API "3. Vérification utilisateur (GET /auth/me)" {
    if (-not $script:token) { throw "Pas de token d'authentification" }
    
    $headers = @{ Authorization = "Bearer $script:token" }
    $response = Invoke-RestMethod -Uri "$API_URL/auth/me" -Method Get -Headers $headers
    
    if (-not $response.success) {
        throw "GET /auth/me échoué"
    }
    
    Write-Host "   Utilisateur authentifié: $($response.user.nom) ($($response.user.role))" -ForegroundColor Gray
}

# 4. Test GET Patients
Test-API "4. Liste des patients (GET /patients)" {
    if (-not $script:token) { throw "Pas de token d'authentification" }
    
    $headers = @{ Authorization = "Bearer $script:token" }
    $response = Invoke-RestMethod -Uri "$API_URL/patients?page=1&limit=10" -Method Get -Headers $headers
    
    Write-Host "   Patients trouvés: $($response.data.Count)" -ForegroundColor Gray
}

# 5. Test GET Médecins
Test-API "5. Liste des médecins (GET /medecins)" {
    if (-not $script:token) { throw "Pas de token d'authentification" }
    
    $headers = @{ Authorization = "Bearer $script:token" }
    $response = Invoke-RestMethod -Uri "$API_URL/medecins?page=1&limit=10" -Method Get -Headers $headers
    
    Write-Host "   Médecins trouvés: $($response.data.Count)" -ForegroundColor Gray
}

# 6. Test GET Centres
Test-API "6. Liste des centres (GET /centres)" {
    if (-not $script:token) { throw "Pas de token d'authentification" }
    
    $headers = @{ Authorization = "Bearer $script:token" }
    $response = Invoke-RestMethod -Uri "$API_URL/centres?page=1&limit=10" -Method Get -Headers $headers
    
    Write-Host "   Centres trouvés: $($response.data.Count)" -ForegroundColor Gray
}

# 7. Test GET Rendez-vous
Test-API "7. Liste des rendez-vous (GET /rendez-vous)" {
    if (-not $script:token) { throw "Pas de token d'authentification" }
    
    $headers = @{ Authorization = "Bearer $script:token" }
    $response = Invoke-RestMethod -Uri "$API_URL/rendez-vous?page=1&limit=10" -Method Get -Headers $headers
    
    Write-Host "   Rendez-vous trouvés: $($response.data.Count)" -ForegroundColor Gray
}

# 8. Test Planning du jour
Test-API "8. Planning du jour (GET /medecin/workflow/planning-du-jour)" {
    if (-not $script:token) { throw "Pas de token d'authentification" }
    
    $today = (Get-Date).ToString("yyyy-MM-dd")
    $headers = @{ Authorization = "Bearer $script:token" }
    $response = Invoke-RestMethod -Uri "$API_URL/medecin/workflow/planning-du-jour?date=$today" -Method Get -Headers $headers
    
    Write-Host "   Rendez-vous du jour: $($response.data.rendez_vous.Count)" -ForegroundColor Gray
}

# 9. Test GET Régions
Test-API "9. Liste des régions (GET /regions)" {
    $response = Invoke-RestMethod -Uri "$API_URL/regions" -Method Get
    
    Write-Host "   Régions trouvées: $($response.data.Count)" -ForegroundColor Gray
}

# 10. Test GET Médicaments
Test-API "10. Liste des médicaments (GET /medicaments)" {
    if (-not $script:token) { throw "Pas de token d'authentification" }
    
    $headers = @{ Authorization = "Bearer $script:token" }
    $response = Invoke-RestMethod -Uri "$API_URL/medicaments?page=1&limit=10" -Method Get -Headers $headers
    
    Write-Host "   Médicaments trouvés: $($response.data.Count)" -ForegroundColor Gray
}

# Résumé
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "✅ Tests réussis: $passed" -ForegroundColor Green
Write-Host "❌ Tests échoués: $failed" -ForegroundColor Red
Write-Host "📋 Total: $($passed + $failed)" -ForegroundColor White
$percentage = [math]::Round(($passed / ($passed + $failed)) * 100, 0)
Write-Host "📈 Taux de réussite: $percentage%`n" -ForegroundColor $(if ($percentage -ge 80) { "Green" } elseif ($percentage -ge 50) { "Yellow" } else { "Red" })

# Détails des tests échoués
$failedTests = $tests | Where-Object { $_.Status -like "*FAIL*" }
if ($failedTests.Count -gt 0) {
    Write-Host "❌ TESTS ÉCHOUÉS:" -ForegroundColor Red
    $failedTests | ForEach-Object { Write-Host "   - $($_.Name): $($_.Status)" -ForegroundColor Yellow }
    Write-Host ""
}

# Sauvegarder les résultats
$results = [PSCustomObject]@{
    Date = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Passed = $passed
    Failed = $failed
    Percentage = $percentage
    Tests = $tests
}

$results | ConvertTo-Json -Depth 5 | Out-File "test-results.json"
Write-Host "📝 Résultats sauvegardés dans test-results.json`n" -ForegroundColor Gray

# Retourner le code approprié
if ($failed -gt 0) {
    exit 1
} else {
    exit 0
}

