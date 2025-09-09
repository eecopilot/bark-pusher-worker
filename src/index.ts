import { APIHandler } from './handlers/apiHandler';
import { handleScheduled } from './handlers/scheduledHandler';
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const apiHandler = new APIHandler(env);
    return await apiHandler.handleRequest(request);
  },

  async scheduled(event: any, env: Env): Promise<void> {
    await handleScheduled(env);
  },
};