# 冷旭帆项目一键检查脚本
# 用法：在项目根目录运行 .\check_project.ps1

Write-Host "===== 1. Python 语法检查 ====="
Get-ChildItem -Path . -Recurse -File -Filter *.py | ForEach-Object {
    python -m py_compile $_.FullName 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "语法错误: $($_.FullName)" -ForegroundColor Red
    }
}
Write-Host "语法检查完成。"

Write-Host "`n===== 2. 单元测试 ====="
python -m pytest tests/test_core_logic.py -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "单元测试未通过，请检查上方报错。" -ForegroundColor Red
    exit 1
}

Write-Host "`n===== 3. 接口冒烟测试（需要 Flask 已启动） ====="
try {
    $state = Invoke-RestMethod -Uri http://127.0.0.1:5000/api/state -Method GET -TimeoutSec 5
    Write-Host "GET /api/state 返回 200，情绪值: $($state.emotion)" -ForegroundColor Green
} catch {
    Write-Host "接口测试失败，请确认 Flask 已启动（python run.py）。" -ForegroundColor Yellow
}

Write-Host "`n所有检查执行完毕。"