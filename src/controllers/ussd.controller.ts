// controllers/ussd.controller.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { ussdService } from '@/services/ussd.service';
import AppError from '@/utils/error';

/**
 * Get supported banks with USSD codes
 * @route GET /api/ussd/banks
 * @access Public
 */
export const getSupportedBanks = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const banks = await ussdService.getSupportedBanks();
  
  res.status(200).json({
    success: true,
    data: banks
  });
});

/**
 * Initiate USSD payment
 * @route POST /api/ussd/initiate
 * @access Private
 */
export const initiateUSSDPayment = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { amount, bankCode } = req.body;
  
  if (!amount || !bankCode) {
    return next(new AppError('Amount and bank code are required', 400));
  }
  
  if (isNaN(amount) || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }
  
  const result = await ussdService.initiateUSSDPayment(userId, amount, bankCode);
  
  res.status(200).json({
    success: true,
    message: 'USSD payment initiated successfully',
    data: result
  });
});

/**
 * Verify USSD payment
 * @route GET /api/ussd/verify/:reference
 * @access Private
 */
export const verifyUSSDPayment = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { reference } = req.params;
  
  if (!reference) {
    return next(new AppError('Reference is required', 400));
  }
  
  const result = await ussdService.verifyUSSDPayment(reference);
  
  res.status(200).json({
    success: true,
    data: result
  });
});