$path = "D:\情绪树洞\public\manifest.json"
$content = @'
{
  "name": "🌳 情绪树洞",
  "short_name": "情绪树洞",
  "description": "温柔治愈的匿名心事分享平台",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fdf6f0",
  "theme_color": "#fdf6f0",
  "orientation": "portrait",
  "scope": "/",
  "icons": [
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='32' fill='%23fdf6f0'/%3E%3Ctext x='96' y='140' font-size='120' text-anchor='middle'%3E🌳%3C/text%3E%3C/svg%3E",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='64' fill='%23fdf6f0'/%3E%3Ctext x='256' y='370' font-size='300' text-anchor='middle'%3E🌳%3C/text%3E%3C/svg%3E",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
'@
$content | Out-File -FilePath $path -Encoding utf8 -Force
Write-Output "OK"
