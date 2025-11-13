# PowerShell version of detect-related-features.sh
# Detects related features based on mockups, tests, and documentation

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureName
)

Write-Host "🔍 Detecting related features for: $FeatureName" -ForegroundColor Cyan

$relatedFeatures = @()
$relatedMockups = @()
$relatedTests = @()
$relatedDocs = @()

# Check mockups
$mockupDir = "frontend/routes/mockups"
if (Test-Path $mockupDir) {
    $mockups = Get-ChildItem -Path $mockupDir -Filter "*.tsx" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $fileName = $_.BaseName
        
        # Check if mockup is related
        if ($content -match $FeatureName -or $fileName -match $FeatureName) {
            $relatedMockups += $fileName
            $fileName
        }
    }
    
    if ($relatedMockups.Count -gt 0) {
        Write-Host "`n📱 Related mockups:" -ForegroundColor Green
        $relatedMockups | ForEach-Object { Write-Host "  - $_" }
        $relatedFeatures += $relatedMockups
    }
}

# Check existing features
$featuresDir = "features/proposed"
if (Test-Path $featuresDir) {
    $features = Get-ChildItem -Path $featuresDir -Directory | ForEach-Object {
        $reqFile = Join-Path $_.FullName "requirements.md"
        if (Test-Path $reqFile) {
            $content = Get-Content $reqFile -Raw
            if ($content -match $FeatureName) {
                $_.Name
            }
        }
    }
    
    if ($features) {
        Write-Host "`n🔗 Related features:" -ForegroundColor Green
        $features | ForEach-Object { Write-Host "  - $_" }
        $relatedFeatures += $features
    }
}

# Check tests
$testsDir = "tests"
if (Test-Path $testsDir) {
    $tests = Get-ChildItem -Path $testsDir -Recurse -Filter "*.test.ts" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $fileName = $_.BaseName
        
        if ($content -match $FeatureName -or $fileName -match $FeatureName) {
            $relatedTests += $fileName
            $fileName
        }
    }
    
    if ($relatedTests.Count -gt 0) {
        Write-Host "`n🧪 Related tests:" -ForegroundColor Green
        $relatedTests | ForEach-Object { Write-Host "  - $_" }
        $relatedFeatures += $relatedTests
    }
}

# Check documentation
$docsDir = "docs"
if (Test-Path $docsDir) {
    $docs = Get-ChildItem -Path $docsDir -Recurse -Filter "*.md" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $fileName = $_.BaseName
        
        if ($content -match $FeatureName) {
            $relatedDocs += $fileName
            $fileName
        }
    }
    
    if ($relatedDocs.Count -gt 0) {
        Write-Host "`n📚 Related documentation:" -ForegroundColor Green
        $relatedDocs | ForEach-Object { Write-Host "  - $_" }
    }
}

# Output JSON for programmatic use
$result = @{
    feature = $FeatureName
    mockups = $relatedMockups
    tests = $relatedTests
    docs = $relatedDocs
    allRelated = $relatedFeatures
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "Mockups: $($relatedMockups.Count)" -ForegroundColor Yellow
Write-Host "Tests: $($relatedTests.Count)" -ForegroundColor Yellow
Write-Host "Docs: $($relatedDocs.Count)" -ForegroundColor Yellow
Write-Host "Total related items: $($relatedFeatures.Count)" -ForegroundColor Yellow

# Ensure feature directory exists
$featureDir = "features/proposed/$FeatureName"
if (-not (Test-Path $featureDir)) {
    New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
}

# Save to file
$outputFile = "$featureDir/related-features.json"
$result | ConvertTo-Json | Set-Content -Path $outputFile
Write-Host "`n✅ Results saved to: $outputFile" -ForegroundColor Green

# Return exit code based on findings
if ($relatedFeatures.Count -gt 0) {
    exit 0
} else {
    Write-Host "⚠️  No related features found" -ForegroundColor Yellow
    exit 0
}
