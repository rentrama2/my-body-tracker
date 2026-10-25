$tpl = [System.IO.File]::ReadAllText("$PSScriptRoot/src/template.html", [System.Text.Encoding]::UTF8)
$css = [System.IO.File]::ReadAllText("$PSScriptRoot/src/styles.css", [System.Text.Encoding]::UTF8)
$js = [System.IO.File]::ReadAllText("$PSScriptRoot/src/app.js", [System.Text.Encoding]::UTF8)

$bundle = $tpl.Replace('/*STYLE_PLACEHOLDER*/', $css).Replace('/*SCRIPT_PLACEHOLDER*/', $js)
[System.IO.File]::WriteAllText("$PSScriptRoot/index.html", $bundle, [System.Text.Encoding]::UTF8)

Write-Host "Success! Bundled index.html size:" (Get-Item "$PSScriptRoot/index.html").Length "bytes"
