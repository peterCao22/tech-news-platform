# ngrok 设置指南

## 什么是 ngrok？

ngrok 是一个反向代理工具，可以将本地服务器暴露到公网，非常适合开发测试Webhook集成。

## 安装 ngrok

### Windows安装

1. **下载 ngrok**
   - 访问: https://ngrok.com/download
   - 选择 Windows 版本下载
   - 或直接下载: https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip

2. **解压文件**
   ```powershell
   # 解压到你想要的目录，如：
   C:\ngrok\ngrok.exe
   ```

3. **添加到系统PATH（可选）**
   - 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
   - 在"系统变量"中找到"Path"，点击"编辑"
   - 添加 ngrok 所在目录，如 `C:\ngrok`

## 注册和认证（推荐）

1. **注册账户**
   - 访问: https://dashboard.ngrok.com/signup
   - 使用GitHub/Google账户快速注册

2. **获取认证令牌**
   - 登录后访问: https://dashboard.ngrok.com/get-started/your-authtoken
   - 复制你的authtoken

3. **配置认证**
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

## 基本使用

### 启动隧道

```powershell
# 方法1: 直接运行（如果在PATH中）
ngrok http 3001

# 方法2: 完整路径
C:\ngrok\ngrok.exe http 3001

# 方法3: 指定区域（亚太地区更快）
ngrok http 3001 --region ap
```

### 启动后显示

```
ngrok                                                                     

Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.x.x
Region                        Asia Pacific (ap)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**重要信息**:
- **公网URL**: `https://abc123.ngrok.io` ← 这个就是你的Webhook URL
- **Web界面**: `http://127.0.0.1:4040` ← 查看请求日志

## 配置Zapier

使用ngrok提供的URL配置Zapier Webhook：

```
Webhook URL: https://abc123.ngrok.io/api/automation/zapier/webhook
```

## ngrok Web界面

访问 `http://127.0.0.1:4040` 可以看到：
- 实时请求日志
- 请求详情（Headers, Body）
- 响应内容
- 重放请求功能

## 免费版限制

- ✅ 每月 40,000 请求
- ✅ 1个在线隧道
- ✅ 随机子域名（每次启动会变）
- ⚠️ 会话超时（8小时）

## 付费版功能（可选）

**Basic计划 ($8/月)**:
- ✅ 固定子域名（如 `yourname.ngrok.io`）
- ✅ 多个隧道
- ✅ 自定义域名支持

## 开发工作流程

### 1. 启动开发服务器
```powershell
# 终端1: 启动API服务器
cd apps/api
pnpm dev
# 运行在 http://localhost:3001
```

### 2. 启动ngrok
```powershell
# 终端2: 启动ngrok
ngrok http 3001 --region ap
# 获得 https://abc123.ngrok.io
```

### 3. 配置Zapier
- 使用 `https://abc123.ngrok.io/api/automation/zapier/webhook`

### 4. 测试
- 触发Zapier
- 查看 `http://127.0.0.1:4040` 观察请求
- 查看API服务器日志

## 常见问题

### 问题1: 每次重启URL都变

**免费版行为**: URL每次启动都会变化

**解决方案**:
1. 升级到Basic计划获得固定域名
2. 或每次重启后更新Zapier配置
3. 开发时保持ngrok持续运行

### 问题2: 连接超时

**解决方案**:
```powershell
# 使用亚太区域
ngrok http 3001 --region ap
```

### 问题3: 会话8小时后断开

**免费版限制**: 免费版会在8小时后断开

**解决方案**:
1. 重新启动ngrok
2. 或升级到付费版

### 问题4: 请求被限流

**解决方案**:
- 注册账户并认证（免费）
- 免费认证用户有40,000请求/月

## 安全建议

1. **不要在生产环境使用ngrok免费版**
2. **使用签名验证Webhook**
3. **不要在公开代码中提交ngrok URL**
4. **注意ngrok日志可能包含敏感信息**

## 替代工具

如果ngrok不可用，可以尝试：
- localtunnel: `npm install -g localtunnel && lt --port 3001`
- serveo: `ssh -R 80:localhost:3001 serveo.net`

---

**总结**: ngrok是开发Webhook最简单的解决方案，免费版足够开发测试使用。

