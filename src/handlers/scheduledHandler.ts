import { TaskService } from '../services/taskService';
import { PushService } from '../services/pushService';
import { Bindings } from '../types';

export async function handleScheduled(env: Bindings): Promise<void> {
  console.log('Running scheduled task handler...');
  
  const taskService = new TaskService(env);
  const pushService = new PushService(env);
  
  try {
    // Get all pending tasks that should be executed now
    const pendingTasks = await taskService.getPendingTasks();
    
    console.log(`Found ${pendingTasks.length} pending tasks to process`);
    
    for (const task of pendingTasks) {
      try {
        console.log(`Processing task ${task.id}: ${task.title}`);
        
        const success = await pushService.sendPush(task);
        
        if (success) {
          await taskService.updateTaskStatus(task.id, 'sent');
          console.log(`Task ${task.id} sent successfully`);
        } else {
          await taskService.updateTaskStatus(task.id, 'failed');
          console.log(`Task ${task.id} failed to send`);
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        await taskService.updateTaskStatus(task.id, 'failed');
      }
    }
    
    console.log('Scheduled task handler completed');
  } catch (error) {
    console.error('Error in scheduled handler:', error);
  }
}