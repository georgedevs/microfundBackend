// controllers/vas.controller.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { vasService } from '@/services/vas.service';
import AppError from '@/utils/error';

/**
 * Get available data bundles
 * @route GET /api/vas/data-bundles
 * @access Private
 */
export const getDataBundles = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { network } = req.query;
  
  if (!network) {
    return next(new AppError('Network parameter is required', 400));
  }
  
  const bundles = await vasService.getDataBundles(network as string);
  
  res.status(200).json({
    success: true,
    data: bundles
  });
});

/**
 * Purchase airtime
 * @route POST /api/vas/airtime
 * @access Private
 */
export const purchaseAirtime = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { phoneNumber, amount } = req.body;
  
  if (!phoneNumber || !amount) {
    return next(new AppError('Phone number and amount are required', 400));
  }
  
  const result = await vasService.purchaseAirtime(userId, phoneNumber, amount);
  
  res.status(200).json({
    success: true,
    message: 'Airtime purchased successfully',
    data: result
  });
});

/**
 * Purchase data bundle
 * @route POST /api/vas/data
 * @access Private
 */
export const purchaseData = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { phoneNumber, planCode, amount } = req.body;
  
  if (!phoneNumber || !planCode || !amount) {
    return next(new AppError('Phone number, plan code, and amount are required', 400));
  }
  
  const result = await vasService.purchaseData(userId, phoneNumber, planCode, amount);
  
  res.status(200).json({
    success: true,
    message: 'Data purchased successfully',
    data: result
  });
});

/**
 * Get VAS transaction history
 * @route GET /api/vas/transactions
 * @access Private
 */
export const getVASTransactions = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const transactions = await vasService.getVASTransactionHistory(userId);
  
  res.status(200).json({
    success: true,
    data: transactions
  });
});