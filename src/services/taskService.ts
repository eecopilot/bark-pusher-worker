import { PushTask, CreateTaskRequest, UpdateTaskRequest, Bindings } from '../types';

export class TaskService {
  constructor(private env: Bindings) {}

  async createTask(request: CreateTaskRequest): Promise<PushTask> {
    const task: PushTask = {
      id: crypto.randomUUID(),
      title: request.title,
      body: request.body,
      deviceKey: request.deviceKey,
      deviceKeys: request.deviceKeys,
      scheduledTime: request.scheduledTime,
      sound: request.sound,
      group: request.group,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.env.TASKS_KV.put(task.id, JSON.stringify(task));
    return task;
  }

  async getTask(id: string): Promise<PushTask | null> {
    const taskData = await this.env.TASKS_KV.get(id);
    return taskData ? JSON.parse(taskData) : null;
  }

  async getAllTasks(): Promise<PushTask[]> {
    const list = await this.env.TASKS_KV.list();
    const tasks: PushTask[] = [];
    
    for (const key of list.keys) {
      const taskData = await this.env.TASKS_KV.get(key.name);
      if (taskData) {
        tasks.push(JSON.parse(taskData));
      }
    }
    
    return tasks.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<PushTask | null> {
    const existingTask = await this.getTask(id);
    if (!existingTask) {
      return null;
    }

    const updatedTask: PushTask = {
      ...existingTask,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.env.TASKS_KV.put(id, JSON.stringify(updatedTask));
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) {
      return false;
    }

    await this.env.TASKS_KV.delete(id);
    return true;
  }

  async getPendingTasks(): Promise<PushTask[]> {
    const allTasks = await this.getAllTasks();
    const now = Date.now();
    
    return allTasks.filter(task => 
      task.status === 'pending' && task.scheduledTime <= now
    );
  }

  async updateTaskStatus(id: string, status: PushTask['status']): Promise<void> {
    const task = await this.getTask(id);
    if (task) {
      task.status = status;
      task.updatedAt = Date.now();
      await this.env.TASKS_KV.put(id, JSON.stringify(task));
    }
  }
}