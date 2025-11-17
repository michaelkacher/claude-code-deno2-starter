# Fix TokenStorage imports to use the new token-storage.ts file

$files = @(
    "islands\LoginForm.tsx",
    "islands\UserProfileDropdown.tsx",
    "islands\SignupForm.tsx",
    "islands\ProfileSettings.tsx",
    "islands\EmailVerificationBanner.tsx",
    "islands\AdminHeaderActions.tsx",
    "islands\AdminDataBrowser.tsx",
    "islands\admin\CreateJobModal.tsx",
    "islands\admin\JobDashboard.tsx",
    "islands\admin\CreateScheduleModal.tsx",
    "lib\api-client.ts"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        
        # Replace imports based on file location
        if ($file -like "islands\admin\*") {
            # Two levels deep
            $content = $content -replace "from '\.\.\/\.\.\/lib\/storage\.ts'", "from '../../lib/token-storage.ts'"
        } elseif ($file -like "islands\*") {
            # One level deep
            $content = $content -replace "from '\.\.\/lib\/storage\.ts'", "from '../lib/token-storage.ts'"
        } elseif ($file -like "lib\*") {
            # Same level
            $content = $content -replace "from '\.\/storage\.ts'", "from './token-storage.ts'"
        }
        
        Set-Content $path -Value $content -NoNewline
        Write-Host "Fixed: $file"
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nDone!" -ForegroundColor Green
