import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { walletService } from '@/services/wallet.service';
import Transaction from '@/models/Transaction';
import AppError from '@/utils/error';
import Wallet from '@/models/Wallet';
import User from '@/models/User';

/**
 * Complete a simulated payment (for testing only)
 * @route POST /api/wallet/mock-payment/:reference
 * @access Private
 */
export const completeMockPayment = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_PAYMENT !== 'true') {
    return res.status(404).json({
      success: false,
      error: 'Endpoint not available in production'
    });
  }

  const { reference } = req.params;
  
  // Complete the payment
  const result = await walletService.verifyDeposit(reference);
  
  res.status(200).json({
    success: true,
    message: 'Mock payment completed successfully',
    data: result
  });
});

/**
 * Get mock payment status (for frontend testing)
 * @route GET /api/wallet/mock-payment-status/:reference
 * @access Public
 */
export const getMockPaymentStatus = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_PAYMENT !== 'true') {
    return res.status(404).json({
      success: false,
      error: 'Endpoint not available in production'
    });
  }

  const { reference } = req.params;
  
  const transaction = await Transaction.findOne({ reference });
  
  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {
      reference,
      status: transaction.status,
      amount: transaction.amount
    }
  });
});

/**
 * Simulate bank account verification (for testing only)
 * @route POST /api/wallet/mock-verify-account
 * @access Public
 */
export const mockVerifyAccount = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_PAYMENT !== 'true') {
    return res.status(404).json({
      success: false,
      error: 'Endpoint not available in production'
    });
  }

  const { bankCode, accountNumber } = req.body;
  
  if (!bankCode || !accountNumber) {
    return next(new AppError('Bank code and account number are required', 400));
  }
  
  // Return mock data
  res.status(200).json({
    success: true,
    data: {
      account_name: "MOCK TEST ACCOUNT",
      account_number: accountNumber
    }
  });
});

export const mockWithdrawal = catchAsyncError(async (
    req: Request, 
    res: Response, 
    next: NextFunction
  ) => {
    if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_PAYMENT !== 'true') {
      return res.status(404).json({
        success: false,
        error: 'Endpoint not available in production'
      });
    }
  
    const userId = req.user.id;
    const { amount, bankCode, accountNumber, accountName } = req.body;
  
    if (!amount || !bankCode || !accountNumber || !accountName) {
      return next(new AppError('Please provide all required fields', 400));
    }
  
    // Get user wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return next(new AppError('Wallet not found', 404));
    }
  
    // Check balance
    if (wallet.balance < amount) {
      return next(new AppError('Insufficient funds', 400));
    }
  
    // Generate reference
    const reference = `MF-WDR-MOCK-${Date.now()}`;
  
    // Create transaction
    const transaction = await Transaction.create({
      userId,
      type: 'withdrawal',
      amount,
      status: 'completed',
      reference,
      description: `Mock withdrawal to ${accountName} (${accountNumber})`,
      metadata: {
        bankCode,
        accountNumber,
        accountName
      }
    });
  
    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save();
  
    // Update user model balance
    const user = await User.findById(userId);
    if (user) {
      user.walletBalance -= amount;
      await user.save();
    }
  
    res.status(200).json({
      success: true,
      message: 'Mock withdrawal processed successfully',
      data: {
        transaction,
        transferDetails: {
          transaction_reference: reference,
          response_description: "Approved or completed successfully",
          currency_id: "NGN",
          amount: amount.toString(),
          account_number: accountNumber,
          account_name: accountName,
          destination_institution_name: "Mock Bank"
        }
      }
    });
  });