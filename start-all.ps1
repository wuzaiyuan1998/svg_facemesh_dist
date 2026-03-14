# FaceMesh 一键启动脚本 (PowerShell)
# 使用方法：右键 → "使用 PowerShell 运行"

$Host.UI.RawUI.WindowTitle = "FaceMesh 一键启动"
Clear-Host

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  馃 FaceMesh 鍒嗗竷寮忛潰鎹曠郴缁 - 涓€閿惎鍔" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 妫€镆 Node.js
try {
    $nodeVersion = node --version
    Write-Host "鈭  Node.js 宸插畨瑁咃细 $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "鈽 閿欒锛氭湭妫€娴埚埌 Node.js" -ForegroundColor Red
    Write-Host "璇峰厛瀹夎 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# 妫€镆ヤ緷璧
if (-not (Test-Path "node_modules\ws")) {
    Write-Host "馃搫 姝e湪瀹夎渚濊禆..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "鈽 渚濊禆瀹夎澶辫触" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "鈭  渚濊禆瀹夎瀹屾垚" -ForegroundColor Green
    Write-Host ""
}

# 鍚姩闈㈡崟绔湇鍔″櫒
Write-Host "馃帹 姝e湪鍚姩闈㈡崟绔湇鍔″櫒..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k", "node capture\capture-server.js" -WindowStyle Normal

# 绛夊緟 2 绉
Start-Sleep -Seconds 2

# 鍚姩娓叉煋绔湇鍔″櫒
Write-Host "馃 姝e湪鍚姩娓叉煋绔湇鍔″櫒..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k", "node renderer\renderer-server.js" -WindowStyle Normal

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  鈭  鏈嶅姟鍣ㄥ惎鍔ㄥ畬鎴愶紒" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "璁块棶鍦板潃锛" -ForegroundColor White
Write-Host "  闈㈡崟绔细 http://localhost:16666/capture.html" -ForegroundColor Yellow
Write-Host "  娓叉煋绔细 http://localhost:16667/" -ForegroundColor Yellow
Write-Host ""
Write-Host "WebSocket 鍦板潃锛" -ForegroundColor White
Write-Host "  ws://localhost:16666/ws" -ForegroundColor Yellow
Write-Host ""
Write-Host "鎸変换鎰忛敭鍏抽棴姝ょ獥鍙ｏ紙涓崭细鍏抽棴鏈嶅姟鍣級" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
pause
