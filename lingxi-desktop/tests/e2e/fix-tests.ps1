# E2E 测试修复脚本

param (
    [string]$TestDir = "D:\resource\python\lingxi\lingxi-desktop\tests\e2e"
)

Set-Location $TestDir

# 需要修复的文件
$filesToFix = @(
    'accessibility.spec.ts',
    'context-management.spec.ts',
    'error-handling.spec.ts',
    'integration-advanced.spec.ts',
    'performance.spec.ts',
    'settings.spec.ts',
    'skill-system.spec.ts',
    'visual-regression.spec.ts',
    'workspace-full-flow.spec.ts'
)

foreach ($file in $filesToFix) {
    $filePath = Join-Path $TestDir $file
    if (Test-Path $filePath) {
        Write-Host "修复：$file"
        
        $content = Get-Content $filePath -Raw
        
        # 修复 test.describe.beforeAll -> test.beforeAll
        $content = $content -replace 'test\.describe\.beforeAll', 'test.beforeAll'
        
        # 修复 test.describe.afterAll -> test.afterAll
        $content = $content -replace 'test\.describe\.afterAll', 'test.afterAll'
        
        # 保存文件
        Set-Content $filePath $content -Encoding UTF8 -NoNewline
        Write-Host "  ✓ 完成"
    } else {
        Write-Host "  ⚠ 文件不存在：$file"
    }
}

# 修复 chat-flow.spec.ts 中的 skip 参数问题
$chatFlowFile = Join-Path $TestDir 'chat-flow.spec.ts'
if (Test-Path $chatFlowFile) {
    Write-Host "修复：chat-flow.spec.ts (skip 参数)"
    
    $content = Get-Content $chatFlowFile -Raw
    
    # 移除测试函数中的 { skip } 参数
    $content = $content -replace "async \(\{ skip \}\)", 'async ()'
    
    # 将 skip() 调用改为 test.skip() 条件跳过
    # 或者直接注释掉这些测试
    $content = $content -replace "skip\(\)", 'test.skip("需要后端服务")'
    
    Set-Content $chatFlowFile $content -Encoding UTF8 -NoNewline
    Write-Host "  ✓ 完成"
}

Write-Host "`n所有修复完成！"
