$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$srcDir  = Join-Path $PSScriptRoot '_src'
$outFile = Join-Path $PSScriptRoot 'index.html'

# ── Đọc template ──
$template = [System.IO.File]::ReadAllText("$srcDir\template.html", $utf8NoBom)

# ── Đọc CSS ──
$css = [System.IO.File]::ReadAllText("$srcDir\style.css", $utf8NoBom)

# ── Đọc và ghép JS theo thứ tự dependency ──
$jsFiles = @('state','map','icon','popup','markers','sidebar','xml','modal','image','actions','ocr','events','search','geo','firestore','auth','quickview')
$jsParts = $jsFiles | ForEach-Object {
    $content = [System.IO.File]::ReadAllText("$srcDir\$_.js", $utf8NoBom)
    "// ═══════════ $($_.ToUpper()) ═══════════`n$content"
}
$js = $jsParts -join "`n`n"

# ── Inject (dùng IndexOf để tránh lỗi ký tự đặc biệt trong regex) ──
function Inject([string]$src, [string]$marker, [string]$content) {
    $idx = $src.IndexOf($marker)
    if ($idx -lt 0) { throw "Marker '$marker' không tìm thấy trong template" }
    $src.Substring(0, $idx) + $content + $src.Substring($idx + $marker.Length)
}

$output = Inject $template '<!-- INJECT:style.css -->' $css
$output = Inject $output  '<!-- INJECT:JS -->'        $js

[System.IO.File]::WriteAllText($outFile, $output, $utf8NoBom)

$sizeKB = [math]::Round((Get-Item $outFile).Length / 1KB)
Write-Host "Build thanh cong: index.html ($sizeKB KB)" -ForegroundColor Green
Write-Host "  $($jsFiles.Count) JS modules + 1 CSS + template" -ForegroundColor Gray
