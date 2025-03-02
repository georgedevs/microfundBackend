// services/payment-link.service.ts
import { paymentService } from './payment';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import crypto from 'crypto';
import AppError from '@/utils/error';

export class PaymentLinkService {
/**
 * Create a shareable payment link
 */
async createPaymentLink(userId, amount, description, redirectLink) {
  // Validate amount
  if (amount < 100) {
    throw new AppError('Minimum amount is ₦100', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate a unique hash for the payment link
  const hash = `mf-${userId.substring(0, 5)}-${Date.now().toString(36)}`;
  
  // Create payment link using Squad API
  try {
    const result = await paymentService.createPaymentLink(
      `MicroFund - ${user.fullName}`,
      hash,
      amount,
      description || `Payment to ${user.fullName}`,
      redirectLink
    );

    if (!result.success) {
      throw new AppError('Failed to create payment link', 500);
    }

    // Create transaction record
    const reference = `MF-LINK-${Date.now()}-${userId.substring(0, 5)}`;
    await Transaction.create({
      userId,
      type: 'payment_link',
      amount,
      status: 'pending',
      reference,
      description: description || 'Payment link created',
      metadata: {
        paymentLinkHash: hash,
        paymentLinkUrl: result.paymentUrl
      }
    });

    return {
      success: true,
      reference,
      paymentLink: result.paymentUrl,
      hash,
      amount,
      description
    };
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw new AppError('Error creating payment link', 500);
  }
}

  /**
   * Get payment links created by a user
   */
  async getUserPaymentLinks(userId: string) {
    const transactions = await Transaction.find({
      userId,
      type: 'payment_link'
    }).sort('-createdAt');

    return transactions;
  }

  /**
   * Verify payment link status
   */
  async verifyPaymentLinkStatus(reference: string) {
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      throw new AppError('Payment link not found', 404);
    }

    // Check if verified already
    if (transaction.status === 'completed') {
      return {
        success: true,
        verified: true,
        transaction
      };
    }

    // Query Squad for the status
    try {
      const result = await paymentService.verifyTransaction(reference);
      
      if (result.success && result.data.transaction_status.toLowerCase() === 'success') {
        // Update transaction status
        transaction.status = 'completed';
        await transaction.save();
        
        return {
          success: true,
          verified: true,
          transaction
        };
      }
      
      return {
        success: true,
        verified: false,
        transaction
      };
    } catch (error) {
      throw new AppError('Error verifying payment link', 500);
    }
  }
}

// Export as singleton
export const paymentLinkService = new PaymentLinkService();