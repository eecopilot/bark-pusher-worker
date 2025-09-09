import { TaskService } from '../services/taskService';
import { PushService } from '../services/pushService';
import { CreateTaskRequest, UpdateTaskRequest, Env } from '../types';

export class APIHandler {
  private taskService: TaskService;
  private pushService: PushService;

  constructor(private env: Env) {
    this.taskService = new TaskService(env);
    this.pushService = new PushService(env);
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/api/test' && method === 'POST') {
        return await this.handleTestPush();
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
}