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
  // Get the signature from headers
  const signature = req.headers['x-squad-encrypted-body'] as string;
  if (!signature) {
    console.warn('Missing signature in Squad webhook');
    return res.status(400).json({ success: false, message: 'Missing signature' });
  }
  
  // Verify signature
  const isValid = squadPaymentService.verifyWebhookSignature(signature, req.body);
  
  if (!isValid) {
    console.warn('Invalid signature in Squad webhook');
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }
  
  const { event_type, data } = req.body;
  
  console.log(`Received webhook: ${event_type}`);
  
  // Handle different event types
  switch (event_type) {
    case 'charge.completed':
      // Process successful payment
      await processSuccessfulPayment(data);
      break;
      
    default:
      console.log(`Unhandled webhook event: ${event_type}`);
  }
  
  // Always return 200 to acknowledge receipt
  return res.status(200).json({ success: true, message: 'Webhook received' });
});

/**
 * Process successful payment
 */
async function processSuccessfulPayment(data: any) {
  const { reference } = data;
  
  // Find transaction by reference
  const transaction = await Transaction.findOne({ reference });
  
  if (!transaction) {
    console.warn(`Transaction not found for reference: ${reference}`);
    return;
  }
  
  // Verify and process the deposit
  await walletService.verifyDeposit(reference);
}