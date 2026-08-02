# One-time dev helper (not a build step). Walks the game's runtime folders
# and prints a ready-to-paste JS array literal for sw.js's PRECACHE_URLS.
# Re-run and re-paste whenever files are added/removed/renamed under
# src/, assets/, or lib/ — bump CACHE_VERSION in sw.js in the same commit.
#
# Note: '/' is precached (and the fetch handler's navigation fallback reads
# from '/') rather than '/index.html' directly, since some static hosts
# 301-redirect /index.html -> / (observed with `serve`), which is safer to
# just avoid than to rely on redirected-response caching support.
$repoRoot = Split-Path -Parent $PSScriptRoot

$paths = @()
$paths += Get-ChildItem -Path (Join-Path $repoRoot "lib") -Recurse -File
$paths += Get-ChildItem -Path (Join-Path $repoRoot "src") -Recurse -File
$paths += Get-ChildItem -Path (Join-Path $repoRoot "assets") -Recurse -File

$relPaths = @("/")
foreach ($p in $paths) {
    if ($p -is [System.IO.FileInfo]) {
        $rel = $p.FullName.Substring($repoRoot.Length + 1) -replace '\\', '/'
    } else {
        $rel = $p
    }
    if ($rel -match '\.DS_Store$' -or $rel -match '\.md$') { continue }
    $relPaths += "/$rel"
}

Write-Host "const PRECACHE_URLS = ["
foreach ($rp in $relPaths) {
    Write-Host "  '$rp',"
}
Write-Host "];"
Write-Host ""
Write-Host "Total: $($relPaths.Count) entries"
