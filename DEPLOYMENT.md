# 部署指南

## 前置要求

1. **Cloudflare 账户**
2. **Node.js** (v18+)
3. **Wrangler CLI** 工具

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Wrangler

如果没有安装 wrangler，先安装：

```bash
npm install -g wrangler
```

登录 Cloudflare：

```bash
wrangler login
```

### 3. 创建 KV 存储

```bash
# 创建生产环境 KV
wrangler kv:namespace create "TASKS_KV"

# 创建预览环境 KV  
wrangler kv:namespace create "TASKS_KV" --preview
```

记录返回的 namespace ID，更新 `wrangler.toml` 中的配置：

```toml
[[kv_namespaces]]
binding = "TASKS_KV"
id = "your-kv-namespace-id"          # 替换为实际ID
preview_id = "your-preview-kv-namespace-id"  # 替换为实际预览ID
```

### 4. 配置环境变量

编辑 `wrangler.toml` 文件，设置你的 Bark 配置：

```toml
[vars]
BARK_URL = "https://bark.860724.xyz"    # 你的 Bark 服务器地址
BARK_KEY = "your-bark-device-key"       # 你的默认设备 key
```

### 5. 开发环境测试

```bash
npm run dev
```

访问 `http://localhost:8787` 测试 API。

### 6. 部署到生产环境

```bash
npm run deploy
```

## 配置定时任务

Worker 已配置为每分钟检查一次待发送的任务。如需修改频率，编辑 `wrangler.toml`：

```toml
[triggers]
crons = ["*/5 * * * *"]  # 每5分钟执行一次
```

Cron 表达式格式：`分 时 日 月 周`

常用例子：
- `"* * * * *"` - 每分钟
- `"*/5 * * * *"` - 每5分钟  
- `"0 * * * *"` - 每小时整点
- `"0 9 * * *"` - 每天上午9点

## 测试部署

部署完成后，可以测试推送功能：

```bash
curl -X POST "https://your-worker.your-subdomain.workers.dev/api/test"
```

## 常见问题

### 1. KV 权限错误
确保在 Cloudflare Dashboard 中为 Worker 绑定了正确的 KV 命名空间。

### 2. Bark 推送失败
- 检查 BARK_URL 是否正确
- 确认 BARK_KEY 有效
- 查看 Worker 日志排查具体错误

### 3. 定时任务不执行
- 确认 Cron Triggers 已正确配置
- 检查 Worker 是否成功部署
- 在 Cloudflare Dashboard 查看 Worker 运行日志

## 监控和日志

在 Cloudflare Dashboard 的 Workers 页面可以查看：
- 请求日志
- 错误信息  
- 性能指标
- Cron 执行情况