import cron from 'node-cron';
import { virtualAccountService } from './virtualAccount.service';
import Transaction from '@/models/Transaction';
import { notificationService } from './notification.service';

export class ScheduledJobsService {
  /**
   * Start all scheduled jobs
   */
  startJobs() {
    // Check for missed webhooks every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Running scheduled job: Check for missed webhooks');
      try {
        await this.checkMissedWebhooks();
      } catch (error) {
        console.error('Error in missed webhooks job:', error);
      }
    });

    console.log('Scheduled jobs started');
  }

  /**
   * Check for missed webhooks
   */
  private async checkMissedWebhooks() {
    try {
      // Get missed webhook transactions
      const result = await virtualAccountService.getWebhookErrorLogs();
      
      if (!result.success || !result.data || !result.data.rows || result.data.rows.length === 0) {
        console.log('No missed webhooks found');
        return;
      }
      
      console.log(`Found ${result.data.rows.length} missed webhooks`);
      
      // Process each missed webhook
      for (const webhookLog of result.data.rows) {
        try {
          // Extract webhook payload
          const payload = webhookLog.payload;
          const transactionRef = webhookLog.transaction_ref;
          
          // Skip if payload or transaction_ref is missing
          if (!payload || !transactionRef) {
            console.warn(`Invalid webhook log entry: missing payload or transaction_ref`);
            continue;
          }
          
          // Check if transaction already processed
          const existingTransaction = await Transaction.findOne({ 
            reference: transactionRef 
          });
          
          if (existingTransaction) {
            console.log(`Transaction ${transactionRef} already processed, deleting from error log`);
            await virtualAccountService.deleteWebhookErrorLog(transactionRef);
            continue;
          }
          
          // Process the webhook
          console.log(`Processing missed webhook for transaction ${transactionRef}`);
          const processResult = await virtualAccountService.handleVirtualAccountWebhook(payload);
          
          if (processResult.success) {
            console.log(`Successfully processed missed webhook for transaction ${transactionRef}`);
            
            // Delete from error log
            await virtualAccountService.deleteWebhookErrorLog(transactionRef);
            
            // Send notification to admin
            try {
              // Find user ID from transaction
              const userId = processResult.data.userId;
              if (userId) {
                await notificationService.createSystemNotification(
                  userId, 
                  'Transaction Processed',
                  `Your transaction of ${processResult.data.amount} has been processed successfully.`,
                  { transactionId: processResult.data._id }
                );
              }
            } catch (notifError) {
              console.error(`Failed to send notification for transaction ${transactionRef}:`, notifError);
            }
            
          } else {
            console.error(`Failed to process missed webhook for transaction ${transactionRef}:`, processResult.message);
          }
        } catch (error) {
          console.error(`Error processing webhook log:`, error);
        }
      }
      
      // Log summary
      console.log(`Completed processing missed webhooks`);
      
    } catch (error) {
      console.error('Error checking missed webhooks:', error);
    }
  }
}

// Export as singleton
export const scheduledJobsService = new ScheduledJobsService();