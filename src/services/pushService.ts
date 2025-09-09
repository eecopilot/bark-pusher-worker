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

      // Use service binding in production, direct API call in development
      let response: Response;
      
      response = await fetch(`${this.env.BARK_URL}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Bark-Push-Worker/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`Push failed with status: ${response.status}`, await response.text());
        return false;
      }

      const result = await response.json();
      console.log('Push sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending push:', error);
      return false;
    }
  }

  async testPush(): Promise<boolean> {
    const testTask: PushTask = {
      id: 'test',
      title: 'Test Push',
      body: 'This is a test notification from bark-push-worker',
      scheduledTime: Date.now(),
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return await this.sendPush(testTask);
  }
}