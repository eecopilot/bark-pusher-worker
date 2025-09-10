export interface PushTask {
  id: string;
  title: string;
  body: string;
  deviceKey?: string;
  deviceKeys?: string[];
  scheduledTime: number; // Unix timestamp
  sound?: string;
  group?: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export interface BarkSinglePushRequest {
  title: string;
  body: string;
  device_key: string;
  sound?: string;
  group?: string;
}

export interface BarkMultiPushRequest {
  title: string;
  body: string;
  device_keys: string[];
  sound?: string;
  group?: string;
}

export interface CreateTaskRequest {
  title: string;
  body: string;
  deviceKey?: string;
  deviceKeys?: string[];
  scheduledTime: number;
  sound?: string;
  group?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  body?: string;
  deviceKey?: string;
  deviceKeys?: string[];
  scheduledTime?: number;
  sound?: string;
  group?: string;
  status?: 'pending' | 'sent' | 'failed';
}

export interface Env {
  TASKS_KV: KVNamespace;
  BARK_URL: string;
  BARK_KEY: string;
  barkService: Fetcher;
}

export interface Bindings extends Env {}