// controllers/payment-link.controller.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { paymentLinkService } from '@/services/payment-link.service';
import AppError from '@/utils/error';

/**
 * Create shareable payment link
 * @route POST /api/payment-links
 * @access Private
 */
export const createPaymentLink = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { amount, description, redirectLink } = req.body;

  if (!amount) {
    return next(new AppError('Please provide an amount', 400));
  }

  if (isNaN(amount) || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }

  const result = await paymentLinkService.createPaymentLink(
    userId,
    amount,
    description || 'MicroFund Payment',
    redirectLink
  );

  res.status(201).json({
    success: true,
    message: 'Payment link created successfully',
    data: result
  });
});

/**
 * Get user's payment links
 * @route GET /api/payment-links
 * @access Private
 */
export const getUserPaymentLinks = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const links = await paymentLinkService.getUserPaymentLinks(userId);

  res.status(200).json({
    success: true,
    data: links
  });
});

/**
 * Verify payment link status
 * @route GET /api/payment-links/:reference/verify
 * @access Private
 */
export const verifyPaymentLink = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { reference } = req.params;

  const result = await paymentLinkService.verifyPaymentLinkStatus(reference);

  res.status(200).json({
    success: true,
    data: result
  });
});