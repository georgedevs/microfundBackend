import { Request, Response } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { squadPaymentService } from '@/services/squad.service';
import { walletService } from '@/services/wallet.service';
import Transaction from '@/models/Transaction';

/**
 * Handle Squad payment webhook
 * @route POST /api/webhooks/squad
 * @access Public
 */
export const handleSquadWebhook = catchAsyncError(async (req: Request, res: Response) => {
  // No need to check signature - middleware already validated it
  
  const { Event, TransactionRef, Body } = req.body;
  
  console.log(`Received webhook: ${Event}, Reference: ${TransactionRef}`);
  
  // Handle different event types
  switch (Event) {
    case 'charge_successful':
      // Process successful payment
      await processSuccessfulPayment(TransactionRef, Body);
      break;
      
    default:
      console.log(`Unhandled webhook event: ${Event}`);
  }
  
  // Always return 200 to acknowledge receipt
  return res.status(200).json({ 
    success: true, 
    message: 'Webhook received',
    transaction_reference: TransactionRef,
    response_code: 200,
    response_description: 'Success'
  });
});

/**
 * Process successful payment
 */
async function processSuccessfulPayment(reference: string, data: any) {
  // Find transaction by reference
  const transaction = await Transaction.findOne({ reference });
  
  if (!transaction) {
    console.warn(`Transaction not found for reference: ${reference}`);
    return;
  }
  
  // Check if transaction is already completed
  if (transaction.status === 'completed') {
    console.log(`Transaction ${reference} already processed`);
    return;
  }
  
  // Verify and process the deposit
  await walletService.verifyDeposit(reference);
}