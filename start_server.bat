@echo off
chcp 65001
echo 启动魔法少女的审判前夜服务器...
echo 访问地址: http://localhost:8392
echo 按 Ctrl+C 停止服务器
cd /d "%~dp0"
"C:\Users\administrator\Desktop\upload\ISOM\Dakes\python.exe" -m http.server 8392
pause
