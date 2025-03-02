import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { bankService } from '@/services/bank.service';

/**
 * Get all banks
 * @route GET /api/banks
 * @access Public
 */
export const getAllBanks = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const banks = await bankService.getAllBanks();
  
  res.status(200).json({
    success: true,
    data: banks
  });
});

/**
 * Verify bank account
 * @route POST /api/banks/verify-account
 * @access Private
 */
export const verifyBankAccount = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { bankCode, accountNumber } = req.body;
  
  const accountDetails = await bankService.verifyBankAccount(bankCode, accountNumber);
  
  res.status(200).json({
    success: true,
    data: accountDetails
  });
});

export const seedBanks = catchAsyncError(async (
    req: Request, 
    res: Response, 
    next: NextFunction
  ) => {
    await bankService.seedBanks();
    
    res.status(200).json({
      success: true,
      message: 'Banks seeded successfully'
    });
  });