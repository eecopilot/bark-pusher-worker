import { BarkSinglePushRequest, BarkMultiPushRequest, PushTask, Bindings } from '../types';

export class PushService {
  constructor(private env: Bindings) {}

  async sendPush(task: PushTask): Promise<boolean> {
    try {
      let requestBody: BarkSinglePushRequest | BarkMultiPushRequest;
      
      if (task.deviceKeys && task.deviceKeys.length > 0) {
        // Multi-user push
        requestBody = {
          title: task.title,
          body: task.body,
          device_keys: task.deviceKeys,
          sound: task.sound,
          group: task.group,
        };
      } else if (task.deviceKey) {
        // Single user push
        requestBody = {
          title: task.title,
          body: task.body,
          device_key: task.deviceKey,
          sound: task.sound,
          group: task.group,
        };
      } else {
        // Use default key from environment
        requestBody = {
          title: task.title,
          body: task.body,
          device_key: this.env.BARK_KEY,
          sound: task.sound,
          group: task.group,
        };
      }
      

      // Use service binding to call bark service
      let response: Response;
      
      response = await this.env.barkService.fetch(
        new Request('https://bark-worker-eep/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
        })
      );

      console.log('响应状态:', response.status, response.statusText);

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async testPush(): Promise<boolean> {
    const testTask: PushTask = {
      id: 'test',
      title: 'Test Push 2',
      body: 'This is a test notification from bark-push-worker',
      scheduledTime: Date.now(),
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return await this.sendPush(testTask);
  }
}