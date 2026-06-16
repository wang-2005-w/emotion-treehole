# 🌳 情绪树洞 - 自动启动器（双击运行）
$projectPath = "C:\Users\王佳雯\Desktop\情绪树洞"
$host.UI.RawUI.WindowTitle = "🌳 情绪树洞"

Write-Host "🌳 情绪树洞 启动中..." -ForegroundColor Green

# 启动服务器
$server = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $projectPath -WindowStyle Hidden -PassThru
Write-Host "✅ 服务器已启动" -ForegroundColor Green
Start-Sleep -Seconds 3

# 循环启动隧道（断了自动重连）
$count = 0
while ($true) {
    $count++
    Write-Host ""
    Write-Host "🔄 启动隧道... (第 $count 次)" -ForegroundColor Yellow
    
    # 启动 localtunnel 并获取输出
    $tunnel = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx localtunnel --port 3457" -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput "$env:TEMP\tunnel_url.txt" -PassThru
    
    # 等几秒获取URL
    Start-Sleep -Seconds 8
    
    # 读取URL
    if (Test-Path "$env:TEMP\tunnel_url.txt") {
        $url = Get-Content "$env:TEMP\tunnel_url.txt" -Tail 1
        if ($url -match "https?://[^\s]+") {
            $match = $matches[0]
            Write-Host "🌐 访问地址: " -NoNewline -ForegroundColor Cyan
            Write-Host "$match" -ForegroundColor White -BackgroundColor DarkBlue
        }
    }
    
    Write-Host "⏳ 隧道运行中，断开后自动重连..." -ForegroundColor DarkYellow
    
    # 等待隧道进程结束
    $tunnel.WaitForExit()
    
    Write-Host "⚠️ 隧道断开，5秒后重连..." -ForegroundColor Red
    Start-Sleep -Seconds 5
}
