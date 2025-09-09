# Bark Push Worker API 文档

## 概述

这是一个基于 Cloudflare Worker 的定时推送系统，使用 Bark API 发送推送通知。

## API 端点

### 1. 测试推送

**POST** `/api/test`

发送一条测试推送通知。

```bash
curl -X POST "https://your-worker.your-subdomain.workers.dev/api/test"
```

### 2. 获取所有任务

**GET** `/api/tasks`

获取所有推送任务列表。

```bash
curl "https://your-worker.your-subdomain.workers.dev/api/tasks"
```

### 3. 创建任务

**POST** `/api/tasks`

创建一个新的推送任务。

**请求体：**
```json
{
  "title": "推送标题",
  "body": "推送内容",
  "scheduledTime": 1640995200000,
  "deviceKey": "可选的设备key",
  "deviceKeys": ["key1", "key2"],
  "sound": "可选的声音",
  "group": "可选的分组"
}
```

**示例：**
```bash
curl -X POST "https://your-worker.your-subdomain.workers.dev/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "定时提醒",
    "body": "该吃药了！",
    "scheduledTime": 1640995200000,
    "sound": "minuet"
  }'
```

### 4. 获取单个任务

**GET** `/api/tasks/{id}`

根据ID获取特定任务。

```bash
curl "https://your-worker.your-subdomain.workers.dev/api/tasks/123e4567-e89b-12d3-a456-426614174000"
```

### 5. 更新任务

**PUT** `/api/tasks/{id}`

更新现有任务。

```bash
curl -X PUT "https://your-worker.your-subdomain.workers.dev/api/tasks/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新的标题",
    "scheduledTime": 1640995200000
  }'
```

### 6. 删除任务

**DELETE** `/api/tasks/{id}`

删除指定任务。

```bash
curl -X DELETE "https://your-worker.your-subdomain.workers.dev/api/tasks/123e4567-e89b-12d3-a456-426614174000"
```

## 数据结构

### PushTask
```typescript
{
  id: string;           // 任务ID
  title: string;        // 推送标题
  body: string;         // 推送内容
  deviceKey?: string;   // 单设备key
  deviceKeys?: string[]; // 多设备keys
  scheduledTime: number; // 计划时间（Unix时间戳）
  sound?: string;       // 声音
  group?: string;       // 分组
  status: 'pending' | 'sent' | 'failed'; // 状态
  createdAt: number;    // 创建时间
  updatedAt: number;    // 更新时间
}
```

## 时间格式

所有时间都使用 Unix 时间戳（毫秒）。

**生成时间戳示例：**
```javascript
// 1小时后
const oneHourLater = Date.now() + 60 * 60 * 1000;

// 明天早上9点
const tomorrow9am = new Date();
tomorrow9am.setDate(tomorrow9am.getDate() + 1);
tomorrow9am.setHours(9, 0, 0, 0);
const timestamp = tomorrow9am.getTime();
```