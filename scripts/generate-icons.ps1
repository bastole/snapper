# One-time icon authoring script (not a build step). Crops frame 0 of the
# Snapper player sprite and composites it onto opaque black canvases at the
# sizes/insets a PWA manifest needs. Re-run only if the icon source or
# padding rules change; commit the resulting PNGs like any other asset.
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $repoRoot "assets\sprites\player\snapper.png"
$outDir = Join-Path $repoRoot "assets\icons"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$src = [System.Drawing.Image]::FromFile($srcPath)

function New-Icon {
    param(
        [string]$DestPath,
        [int]$CanvasSize,
        [double]$ScalePct
    )

    $bmp = New-Object System.Drawing.Bitmap $CanvasSize, $CanvasSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Black)

    $drawSize = [int]($CanvasSize * $ScalePct)
    $offset = [int](($CanvasSize - $drawSize) / 2)
    $destRect = New-Object System.Drawing.Rectangle $offset, $offset, $drawSize, $drawSize
    $srcRect = New-Object System.Drawing.Rectangle 0, 0, 128, 128

    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $bmp.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Wrote $DestPath"
}

New-Icon -DestPath (Join-Path $outDir "icon-192.png") -CanvasSize 192 -ScalePct 0.90
New-Icon -DestPath (Join-Path $outDir "icon-512.png") -CanvasSize 512 -ScalePct 0.90
New-Icon -DestPath (Join-Path $outDir "icon-maskable-192.png") -CanvasSize 192 -ScalePct 0.60
New-Icon -DestPath (Join-Path $outDir "icon-maskable-512.png") -CanvasSize 512 -ScalePct 0.60
New-Icon -DestPath (Join-Path $outDir "icon-apple-touch-180.png") -CanvasSize 180 -ScalePct 0.90

$src.Dispose()
Write-Host "Done."
