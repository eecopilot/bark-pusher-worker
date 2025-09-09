import { TaskService } from '../services/taskService';
import { PushService } from '../services/pushService';
import { CreateTaskRequest, UpdateTaskRequest, Bindings } from '../types';

export class APIHandler {
  private taskService: TaskService;
  private pushService: PushService;

  constructor(private env: Bindings) {
    this.taskService = new TaskService(env);
    this.pushService = new PushService(env);
  }

  private checkBasicAuth(request: Request): { success: boolean; message: string } {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return { success: false, message: 'Unauthorized: Missing or invalid Authorization header' };
    }

    try {
      const base64Credentials = authHeader.substring(6);
      const credentials = atob(base64Credentials);
      const [username, password] = credentials.split(':');

      if (username === 'eep' && password === '123123aaa') {
        return { success: true, message: 'OK' };
      } else {
        return { success: false, message: 'Unauthorized: Invalid credentials' };
      }
    } catch (error) {
      return { success: false, message: 'Unauthorized: Invalid credentials format' };
    }
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Basic Authentication check for API endpoints
    if (path.startsWith('/api/')) {
      const authResult = this.checkBasicAuth(request);
      if (!authResult.success) {
        return new Response(authResult.message, {
          status: 401,
          headers: {
            ...corsHeaders,
            'WWW-Authenticate': 'Basic realm="Bark Push Worker"'
          }
        });
      }
    }

    try {
      // 静态文件服务
      if (path === '/' && method === 'GET') {
        return await this.handleStaticFile('index.html');
      }

      if (path === '/api/test' && method === 'POST') {
        return await this.handleTestPush();
      }

      if (path === '/api/trigger-pending' && method === 'POST') {
        return await this.handleTriggerPendingTasks();
      }

      if (path === '/api/tasks' && method === 'GET') {
        return await this.handleGetTasks();
      }

      if (path === '/api/tasks' && method === 'POST') {
        return await this.handleCreateTask(request);
      }

      if (path.startsWith('/api/tasks/') && method === 'GET') {
        const id = path.split('/')[3];
        return await this.handleGetTask(id);
      }

      if (path.startsWith('/api/tasks/') && method === 'PUT') {
        const id = path.split('/')[3];
        return await this.handleUpdateTask(id, request);
      }

      if (path.startsWith('/api/tasks/') && method === 'DELETE') {
        const id = path.split('/')[3];
        return await this.handleDeleteTask(id);
      }

      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });
    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  private async handleTestPush(): Promise<Response> {
    const success = await this.pushService.testPush();
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleTriggerPendingTasks(): Promise<Response> {
    try {
      const tasks = await this.taskService.getAllTasks();
      const pendingTasks = tasks.filter(task => task.status === 'pending');
      
      const results = [];
      for (const task of pendingTasks) {
        const success = await this.pushService.sendPush(task);
        if (success) {
          await this.taskService.updateTask(task.id, { status: 'sent' });
          results.push({ id: task.id, title: task.title, success: true });
        } else {
          await this.taskService.updateTask(task.id, { status: 'failed' });
          results.push({ id: task.id, title: task.title, success: false });
        }
      }
      
      return new Response(JSON.stringify({ 
        message: `Processed ${pendingTasks.length} pending tasks`,
        results 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Failed to trigger pending tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async handleGetTasks(): Promise<Response> {
    const tasks = await this.taskService.getAllTasks();
    return new Response(JSON.stringify(tasks), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleCreateTask(request: Request): Promise<Response> {
    const body: CreateTaskRequest = await request.json();
    
    // Validate required fields
    if (!body.title || !body.body || !body.scheduledTime) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const task = await this.taskService.createTask(body);
    return new Response(JSON.stringify(task), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleGetTask(id: string): Promise<Response> {
    const task = await this.taskService.getTask(id);
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(task), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleUpdateTask(id: string, request: Request): Promise<Response> {
    const body: UpdateTaskRequest = await request.json();
    const task = await this.taskService.updateTask(id, body);
    
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(task), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleDeleteTask(id: string): Promise<Response> {
    const success = await this.taskService.deleteTask(id);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleStaticFile(filename: string): Promise<Response> {
    // 简单的内嵌HTML，实际项目中可以使用KV存储或其他方式
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bark Push Worker - 任务管理</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f7;
            color: #1d1d1f;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            color: #007aff;
        }

        .header p {
            font-size: 1.1rem;
            color: #6e6e73;
        }

        .controls {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .controls h2 {
            margin-bottom: 20px;
            color: #1d1d1f;
        }

        .form-group {
            margin-bottom: 16px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #1d1d1f;
        }

        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 1px solid #d2d2d7;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
        }

        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #007aff;
            box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        textarea {
            resize: vertical;
            min-height: 80px;
        }

        .form-row {
            display: flex;
            gap: 16px;
        }

        .form-row .form-group {
            flex: 1;
        }

        .btn {
            background: #007aff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .btn:hover {
            background: #0056b3;
        }

        .btn-secondary {
            background: #8e8e93;
        }

        .btn-secondary:hover {
            background: #6d6d70;
        }

        .btn-danger {
            background: #ff3b30;
        }

        .btn-danger:hover {
            background: #d70015;
        }

        .btn-small {
            padding: 6px 12px;
            font-size: 14px;
        }

        .tasks-section {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .tasks-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .task-card {
            border: 1px solid #e5e5e7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
            transition: box-shadow 0.2s;
        }

        .task-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 12px;
        }

        .task-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 4px;
        }

        .task-body {
            color: #6e6e73;
            margin-bottom: 12px;
        }

        .task-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 0.9rem;
            color: #8e8e93;
        }

        .task-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
        }

        .status-pending {
            background: #fff3cd;
            color: #856404;
        }

        .status-sent {
            background: #d1edff;
            color: #0c5460;
        }

        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }

        .task-actions {
            display: flex;
            gap: 8px;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #8e8e93;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #8e8e93;
        }

        .empty-state h3 {
            margin-bottom: 8px;
            color: #6e6e73;
        }

        @media (max-width: 768px) {
            .form-row {
                flex-direction: column;
            }
            
            .tasks-header {
                flex-direction: column;
                gap: 16px;
                align-items: stretch;
            }

            .task-header {
                flex-direction: column;
                gap: 12px;
            }

            .task-actions {
                justify-content: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bark Push Worker</h1>
            <p>推送通知任务管理系统</p>
        </div>

        <div class="controls">
            <h2>创建新任务</h2>
            <form id="taskForm">
                <div class="form-group">
                    <label for="title">标题 *</label>
                    <input type="text" id="title" name="title" required>
                </div>

                <div class="form-group">
                    <label for="body">内容 *</label>
                    <textarea id="body" name="body" required></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="scheduledTime">计划发送时间 *</label>
                        <input type="datetime-local" id="scheduledTime" name="scheduledTime" required>
                    </div>
                    <div class="form-group">
                        <label for="sound">提示音</label>
                        <select id="sound" name="sound">
                            <option value="">默认</option>
                            <option value="alarm">alarm</option>
                            <option value="anticipate">anticipate</option>
                            <option value="bell">bell</option>
                            <option value="birdsong">birdsong</option>
                            <option value="bloom">bloom</option>
                            <option value="calypso">calypso</option>
                            <option value="chime">chime</option>
                            <option value="choo">choo</option>
                            <option value="descent">descent</option>
                            <option value="electronic">electronic</option>
                            <option value="fanfare">fanfare</option>
                            <option value="glass">glass</option>
                            <option value="gotosleep">gotosleep</option>
                            <option value="healthnotification">healthnotification</option>
                            <option value="horn">horn</option>
                            <option value="ladder">ladder</option>
                            <option value="mailsent">mailsent</option>
                            <option value="minuet">minuet</option>
                            <option value="multiwayinvitation">multiwayinvitation</option>
                            <option value="newmail">newmail</option>
                            <option value="newsflash">newsflash</option>
                            <option value="noir">noir</option>
                            <option value="paymentsuccess">paymentsuccess</option>
                            <option value="shake">shake</option>
                            <option value="sherwoodforest">sherwoodforest</option>
                            <option value="silence">silence</option>
                            <option value="spell">spell</option>
                            <option value="suspense">suspense</option>
                            <option value="telegraph">telegraph</option>
                            <option value="tiptoes">tiptoes</option>
                            <option value="typewriters">typewriters</option>
                            <option value="update">update</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="deviceKey">设备密钥 (可选)</label>
                        <input type="text" id="deviceKey" name="deviceKey" placeholder="留空使用默认密钥">
                    </div>
                    <div class="form-group">
                        <label for="group">分组 (可选)</label>
                        <input type="text" id="group" name="group" placeholder="通知分组">
                    </div>
                </div>

                <button type="submit" class="btn">创建任务</button>
                <button type="button" class="btn btn-secondary" onclick="sendTestPush()">发送测试推送</button>
            </form>
        </div>

        <div class="tasks-section">
            <div class="tasks-header">
                <h2>任务列表</h2>
                <button class="btn btn-secondary btn-small" onclick="loadTasks()">刷新</button>
            </div>
            <div id="tasksContainer">
                <div class="loading">加载中...</div>
            </div>
        </div>
    </div>

    <script>
        // API 基础URL
        const API_BASE = '/api';
        
        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', function() {
            loadTasks();
            
            // 设置默认时间为当前时间 + 1分钟
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1);
            document.getElementById('scheduledTime').value = now.toISOString().slice(0, 16);
            
            // 绑定表单提交事件
            document.getElementById('taskForm').addEventListener('submit', handleCreateTask);
        });

        // 加载任务列表
        async function loadTasks() {
            try {
                const response = await fetch(API_BASE + '/tasks');
                const tasks = await response.json();
                
                const container = document.getElementById('tasksContainer');
                
                if (!tasks || tasks.length === 0) {
                    container.innerHTML = '<div class="empty-state"><h3>暂无任务</h3><p>创建你的第一个推送任务吧</p></div>';
                    return;
                }
                
                container.innerHTML = tasks.map(task => 
                    '<div class="task-card">' +
                    '<div class="task-header">' +
                    '<div>' +
                    '<div class="task-title">' + escapeHtml(task.title) + '</div>' +
                    '<div class="task-body">' + escapeHtml(task.body) + '</div>' +
                    '</div>' +
                    '<div class="task-actions">' +
                    '<button class="btn btn-small btn-danger" onclick="deleteTask(\\'' + task.id + '\\')">删除</button>' +
                    '</div>' +
                    '</div>' +
                    '<div class="task-meta">' +
                    '<span class="task-status status-' + task.status + '">' + getStatusText(task.status) + '</span>' +
                    '<span>计划时间: ' + formatDateTime(task.scheduledTime) + '</span>' +
                    '<span>创建时间: ' + formatDateTime(task.createdAt) + '</span>' +
                    (task.sound ? '<span>提示音: ' + task.sound + '</span>' : '') +
                    (task.group ? '<span>分组: ' + task.group + '</span>' : '') +
                    '</div>' +
                    '</div>'
                ).join('');
                
            } catch (error) {
                console.error('加载任务失败:', error);
                document.getElementById('tasksContainer').innerHTML = '<div class="empty-state"><h3>加载失败</h3><p>请检查网络连接或稍后重试</p></div>';
            }
        }

        // 处理创建任务
        async function handleCreateTask(event) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const taskData = {
                title: formData.get('title'),
                body: formData.get('body'),
                scheduledTime: new Date(formData.get('scheduledTime')).getTime(),
                sound: formData.get('sound') || undefined,
                deviceKey: formData.get('deviceKey') || undefined,
                group: formData.get('group') || undefined
            };
            
            try {
                const response = await fetch(API_BASE + '/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(taskData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || '创建任务失败');
                }
                
                // 重置表单
                event.target.reset();
                
                // 重新设置默认时间
                const now = new Date();
                now.setMinutes(now.getMinutes() + 1);
                document.getElementById('scheduledTime').value = now.toISOString().slice(0, 16);
                
                // 刷新任务列表
                loadTasks();
                
                alert('任务创建成功！');
                
            } catch (error) {
                console.error('创建任务失败:', error);
                alert('创建任务失败: ' + error.message);
            }
        }

        // 删除任务
        async function deleteTask(taskId) {
            if (!confirm('确定要删除这个任务吗？')) {
                return;
            }
            
            try {
                const response = await fetch(API_BASE + '/tasks/' + taskId, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error('删除任务失败');
                }
                
                loadTasks();
                alert('任务删除成功！');
                
            } catch (error) {
                console.error('删除任务失败:', error);
                alert('删除任务失败: ' + error.message);
            }
        }

        // 发送测试推送
        async function sendTestPush() {
            try {
                const response = await fetch(API_BASE + '/test', {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('测试推送发送成功！');
                } else {
                    alert('测试推送发送失败');
                }
                
            } catch (error) {
                console.error('发送测试推送失败:', error);
                alert('发送测试推送失败: ' + error.message);
            }
        }

        // 工具函数
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatDateTime(timestamp) {
            return new Date(timestamp).toLocaleString('zh-CN');
        }

        function getStatusText(status) {
            const statusMap = {
                'pending': '待发送',
                'sent': '已发送',
                'failed': '发送失败'
            };
            return statusMap[status] || status;
        }
    </script>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}