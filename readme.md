# 运行一cloudflare worker的一个推送程序

1. 对任务操作：增删改查
2. 对任务设定推送时间
3. 时间到达，触发推送

## 环境设置

1. 复制 `wrangler.toml.example` 为 `wrangler.toml`
2. 设置环境变量：
   ```bash
   export BARK_KEY="your-bark-key-here"
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
4. 启动开发环境：
   ```bash
   pnpm dev
   ```


# 推送接口

## 单用户推送
```
curl -X "POST" "https://api.day.app/push" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "body": "Test Bark Server",
  "title": "Test Title",
  "device_key": "your_key"
}'
```

## 多用户推送
```
curl -X "POST" "https://api.day.app/push" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "title": "Title",
  "body": "Body",
  "sound": "minuet",
  "group": "test",
  "device_keys": ["key1", "key2", ... ]
}'
```