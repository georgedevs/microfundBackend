import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { virtualAccountService } from '@/services/virtualAccount.service';
import AppError from '@/utils/error';

/**
 * Create a virtual account for a user
 * @route POST /api/wallet/virtual-account
 * @access Private
 */
export const createVirtualAccount = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const result = await virtualAccountService.createVirtualAccount(userId);
  
  res.status(200).json({
    success: true,
    message: 'Virtual account created successfully',
    data: result.data
  });
});

/**
 * Handle virtual account webhook
 * @route POST /api/webhooks/virtual-account
 * @access Public
 */
export const handleVirtualAccountWebhook = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // We assume signature is already validated by middleware
  const result = await virtualAccountService.handleVirtualAccountWebhook(req.body);
  
  // Always return 200 to acknowledge receipt, regardless of processing result
  // This is important for Squad webhook flow
  return res.status(200).json({
    response_code: 200,
    transaction_reference: req.body.transaction_reference,
    response_description: 'Success'
  });
});