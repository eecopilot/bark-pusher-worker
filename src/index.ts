import { APIHandler } from './handlers/apiHandler';
import { handleScheduled } from './handlers/scheduledHandler';
import { Bindings } from './types';

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    const apiHandler = new APIHandler(env);
    return await apiHandler.handleRequest(request);
  },

  async scheduled(event: any, env: Bindings): Promise<void> {
    await handleScheduled(env);
  },
};