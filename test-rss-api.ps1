# RSS API 测试脚本

$baseUrl = "http://localhost:3001/api"

# 1. 登录获取JWT令牌
Write-Host "=== 1. 登录获取JWT令牌 ===" -ForegroundColor Green
$loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@test.com","password":"Test123456"}'
$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.data.token
Write-Host "登录成功，获取到JWT令牌" -ForegroundColor Yellow

# 2. 测试RSS URL验证
Write-Host "`n=== 2. 测试RSS URL验证 ===" -ForegroundColor Green
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# 测试有效的RSS URL
$validRssUrl = "https://feeds.feedburner.com/oreilly/radar"
$validateBody = @{
    url = $validRssUrl
} | ConvertTo-Json

try {
    $validateResponse = Invoke-WebRequest -Uri "$baseUrl/sources/validate-url" -Method POST -Headers $headers -Body $validateBody
    $validateData = $validateResponse.Content | ConvertFrom-Json
    Write-Host "RSS URL验证结果: $($validateData.data.valid)" -ForegroundColor Yellow
    if ($validateData.data.valid) {
        Write-Host "RSS标题: $($validateData.data.title)" -ForegroundColor Cyan
        Write-Host "RSS描述: $($validateData.data.description)" -ForegroundColor Cyan
        Write-Host "内容数量: $($validateData.data.itemCount)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "RSS URL验证失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 创建RSS源
Write-Host "`n=== 3. 创建RSS源 ===" -ForegroundColor Green
$createSourceBody = @{
    name = "O'Reilly Radar"
    type = "RSS"
    url = $validRssUrl
    config = @{
        description = "O'Reilly技术雷达RSS源"
        category = "tech"
    }
} | ConvertTo-Json

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/sources" -Method POST -Headers $headers -Body $createSourceBody
    $createData = $createResponse.Content | ConvertFrom-Json
    $sourceId = $createData.data.id
    Write-Host "RSS源创建成功，ID: $sourceId" -ForegroundColor Yellow
    Write-Host "源名称: $($createData.data.name)" -ForegroundColor Cyan
} catch {
    Write-Host "创建RSS源失败: $($_.Exception.Message)" -ForegroundColor Red
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorContent = $reader.ReadToEnd()
        Write-Host "错误详情: $errorContent" -ForegroundColor Red
    }
}

# 4. 获取RSS源列表
Write-Host "`n=== 4. 获取RSS源列表 ===" -ForegroundColor Green
try {
    $sourcesResponse = Invoke-WebRequest -Uri "$baseUrl/sources" -Method GET -Headers @{"Content-Type"="application/json"}
    $sourcesData = $sourcesResponse.Content | ConvertFrom-Json
    Write-Host "RSS源数量: $($sourcesData.data.Count)" -ForegroundColor Yellow
    foreach ($source in $sourcesData.data) {
        Write-Host "- $($source.name) ($($source.type)) - 状态: $($source.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "获取RSS源列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 手动触发RSS抓取（如果有源的话）
if ($sourceId) {
    Write-Host "`n=== 5. 手动触发RSS抓取 ===" -ForegroundColor Green
    try {
        $fetchResponse = Invoke-WebRequest -Uri "$baseUrl/sources/$sourceId/fetch" -Method POST -Headers $headers
        $fetchData = $fetchResponse.Content | ConvertFrom-Json
        Write-Host "RSS抓取结果:" -ForegroundColor Yellow
        Write-Host "- 成功: $($fetchData.data.success)" -ForegroundColor Cyan
        Write-Host "- 新内容数量: $($fetchData.data.newItemsCount)" -ForegroundColor Cyan
    } catch {
        Write-Host "RSS抓取失败: $($_.Exception.Message)" -ForegroundColor Red
        $errorResponse = $_.Exception.Response
        if ($errorResponse) {
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $errorContent = $reader.ReadToEnd()
            Write-Host "错误详情: $errorContent" -ForegroundColor Red
        }
    }
}

# 6. 获取内容列表
Write-Host "`n=== 6. 获取内容列表 ===" -ForegroundColor Green
try {
    $contentResponse = Invoke-WebRequest -Uri "$baseUrl/content?limit=5" -Method GET -Headers @{"Content-Type"="application/json"}
    $contentData = $contentResponse.Content | ConvertFrom-Json
    Write-Host "内容总数: $($contentData.pagination.total)" -ForegroundColor Yellow
    Write-Host "当前页内容数量: $($contentData.data.Count)" -ForegroundColor Yellow
    foreach ($content in $contentData.data) {
        Write-Host "- $($content.title)" -ForegroundColor Cyan
        Write-Host "  状态: $($content.status) | 来源: $($content.source.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "获取内容列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 测试完成 ===" -ForegroundColor Green
