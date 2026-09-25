Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\abasq\.gemini\antigravity-ide\brain\dfa3a407-380f-40ec-8842-5df0bb9fbcf6\padel_pwa_icon_1790370498413.jpg"
$outDir = "C:\Users\abasq\.gemini\antigravity-ide\scratch\padelsanpedro\public\icons"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$src = [System.Drawing.Bitmap]::new($srcPath)

function Resize-And-Save($sourceImg, $w, $h, $destinationPath) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($sourceImg, 0, 0, $w, $h)
    $bmp.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $destinationPath ($w x $h)"
}

Resize-And-Save $src 512 512 "$outDir\icon-512x512.png"
Resize-And-Save $src 512 512 "$outDir\icon-maskable-512x512.png"
Resize-And-Save $src 192 192 "$outDir\icon-192x192.png"
Resize-And-Save $src 180 180 "$outDir\apple-touch-icon.png"
Resize-And-Save $src 72 72 "$outDir\badge-72x72.png"
Resize-And-Save $src 192 192 "C:\Users\abasq\.gemini\antigravity-ide\scratch\padelsanpedro\public\globe_192.png"
Resize-And-Save $src 512 512 "C:\Users\abasq\.gemini\antigravity-ide\scratch\padelsanpedro\public\globe_512.png"

$src.Dispose()
Write-Host "All icons generated successfully!"
