# Fix missing imports in notification routes

$files = @(
    "routes\api\notifications\unread-count.ts",
    "routes\api\notifications\read-all.ts",
    "routes\api\notifications\create.ts"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        
        # Find the last import line
        $lines = $content -split "`n"
        $lastImportIndex = -1
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "^import ") {
                $lastImportIndex = $i
            }
        }
        
        if ($lastImportIndex -ge 0) {
            # Insert the new import after the last import
            $newImport = "import { withErrorHandler, requireUser, successResponse, type AppState } from '@/lib/fresh-helpers.ts';"
            $lines = @($lines[0..$lastImportIndex]) + $newImport + @($lines[($lastImportIndex+1)..($lines.Length-1)])
            $content = $lines -join "`n"
            Set-Content $path -Value $content -NoNewline
            Write-Host "Fixed: $file"
        }
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nDone!" -ForegroundColor Green
