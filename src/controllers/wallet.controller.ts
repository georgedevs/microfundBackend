import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { walletService } from '@/services/wallet.service';
import AppError from '@/utils/error';

/**
 * Get wallet details and balance
 * @route GET /api/wallet
 * @access Private
 */
export const getWallet = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const result = await walletService.getWalletDetails(userId);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Initiate deposit to wallet
 * @route POST /api/wallet/deposit
 * @access Private
 */
export const initiateDeposit = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }

  const result = await walletService.initiateDeposit(userId, amount);

  res.status(200).json({
    success: true,
    data: {
      reference: result.reference,
      checkoutUrl: result.checkoutUrl,
      message: 'Deposit initiated. Please complete payment.'
    }
  });
});

/**
 * Verify deposit to wallet
 * @route GET /api/wallet/deposit/:reference
 * @access Private
 */
export const verifyDeposit = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { reference } = req.params;

  const result = await walletService.verifyDeposit(reference);

  if (!result.success) {
    return res.status(200).json({
      success: false,
      message: 'Payment verification failed',
      data: {
        transaction: result.transaction,
        merchant_info: result.merchant_info
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      transaction: result.transaction,
      merchant_info: result.merchant_info
    }
  });
});

/**
 * Get transaction history
 * @route GET /api/wallet/transactions
 * @access Private
 */
export const getTransactionHistory = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const result = await walletService.getTransactionHistory(userId, req.query);

  res.status(200).json({
    success: true,
    data: result
  });
});