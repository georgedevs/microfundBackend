import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { walletService } from '@/services/wallet.service';
import AppError from '@/utils/error';

/**
 * Withdraw funds to bank account
 * @route POST /api/wallet/withdraw
 * @access Private
 */
// In withdraw.controller.ts
export const withdrawToBank = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { amount, bankCode, accountNumber, accountName } = req.body;

  // Input validation
  if (!amount || !bankCode || !accountNumber || !accountName) {
    return next(new AppError('Please provide all required fields', 400));
  }

  if (isNaN(amount) || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }

  try {
    // Process withdrawal
    const result = await walletService.withdrawToBank(
      userId,
      amount,
      bankCode,
      accountNumber,
      accountName
    );

    res.status(200).json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: result
    });
  } catch (error) {
    // Log and pass to error handler
    console.error('Withdrawal error:', error);
    next(error);
  }
});