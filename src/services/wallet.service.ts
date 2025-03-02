import User from '@/models/User';
import Wallet from '@/models/Wallet';
import Transaction, { TransactionType, TransactionStatus } from '@/models/Transaction';
import { paymentService } from '@/services/payment';
import { bankService } from '@/services/bank.service';
import AppError from '@/utils/error';
import mongoose from 'mongoose';
import crypto from 'crypto';

export class WalletService {
  /**
   * Get or create a wallet for a user
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
      });
    }

    return wallet;
  }

  /**
   * Initiate a deposit to user's wallet
   */
  async initiateDeposit(userId: string, amount: number) {
    if (amount < 100) {
      throw new AppError('Minimum deposit amount is ₦100', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate unique reference
    const reference = `MF-DEP-${Date.now()}-${userId.substring(0, 5)}`;

    // Initialize payment with payment service
    const result = await paymentService.initializeTransaction(
      amount,
      user.email,
      reference,
      user.fullName,
      {
        userId,
        transactionType: 'deposit'
      }
    );

    // Create transaction record
    await Transaction.create({
      userId,
      type: 'deposit' as TransactionType,
      amount,
      status: 'pending' as TransactionStatus,
      reference,
      description: 'Wallet deposit',
      metadata: {
        checkoutUrl: result.checkoutUrl
      }
    });

    return {
      reference,
      checkoutUrl: result.checkoutUrl
    };
  }

  /**
   * Verify and process a deposit
   */
  async verifyDeposit(reference: string) {
    // Find transaction record
    const transaction = await Transaction.findOne({ reference });
    
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status === 'completed') {
      return { success: true, transaction };
    }

    // Verify with payment service
    const result = await paymentService.verifyTransaction(reference);

    if (!result.success) {
      // If verification failed, update transaction status
      transaction.status = 'failed';
      await transaction.save();
      return { success: false, transaction };
    }

    const verificationData = result.data;

    console.log("Verification Data:", verificationData);

    // Check if payment was successful
    if (verificationData.transaction_status.toLowerCase() === 'success') {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update transaction status
        transaction.status = 'completed';
        await transaction.save({ session });

        // Update user wallet balance
        const wallet = await Wallet.findOne({ userId: transaction.userId });
        if (!wallet) {
          throw new AppError('Wallet not found', 404);
        }

        wallet.balance += transaction.amount;
        await wallet.save({ session });

        // Also update user model balance for convenience
        const user = await User.findById(transaction.userId);
        if (!user) {
          throw new AppError('User not found', 404);
        }

        user.walletBalance += transaction.amount;
        await user.save({ session });

        await session.commitTransaction();
        return { success: true, transaction, merchant_info: verificationData.merchant_info  };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // Payment was not successful
      transaction.status = 'failed';
      await transaction.save();
      return { success: false, transaction };
    }
  }

  /**
   * Get wallet details and recent transactions
   */
  async getWalletDetails(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      wallet,
      recentTransactions
    };
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userId: string, query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId };

    // Add filters for transaction type if provided
    if (query.type) {
      filter.type = query.type;
    }

    // Add filters for status if provided
    if (query.status) {
      filter.status = query.status;
    }

    // Date range filters
    if (query.startDate && query.endDate) {
      filter.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate)
      };
    } else if (query.startDate) {
      filter.createdAt = { $gte: new Date(query.startDate) };
    } else if (query.endDate) {
      filter.createdAt = { $lte: new Date(query.endDate) };
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Transfer funds between wallets (internal)
   */
  async transferFunds(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
    transactionType: TransactionType = 'transfer'
  ) {
    if (amount < 50) {
      throw new AppError('Minimum transfer amount is ₦50', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check sender wallet
      const senderWallet = await Wallet.findOne({ userId: fromUserId });
      if (!senderWallet) {
        throw new AppError('Sender wallet not found', 404);
      }

      // Verify sufficient balance
      if (senderWallet.balance < amount) {
        throw new AppError('Insufficient funds', 400);
      }

      // Get or create recipient wallet
      const recipientWallet = await this.getOrCreateWallet(toUserId);

      // Generate reference
      const reference = `MF-TRF-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      // Deduct from sender
      senderWallet.balance -= amount;
      await senderWallet.save({ session });

      // Update sender's user model balance
      const sender = await User.findById(fromUserId);
      if (sender) {
        sender.walletBalance -= amount;
        await sender.save({ session });
      }

      // Add to recipient
      recipientWallet.balance += amount;
      await recipientWallet.save({ session });

      // Update recipient's user model balance
      const recipient = await User.findById(toUserId);
      if (recipient) {
        recipient.walletBalance += amount;
        await recipient.save({ session });
      }

      // Create sender transaction record
      await Transaction.create([{
        userId: fromUserId,
        type: transactionType,
        amount,
        status: 'completed',
        reference: `${reference}-OUT`,
        description: `${description} (Sent)`,
        metadata: {
          recipientId: toUserId
        }
      }], { session });

      // Create recipient transaction record
      await Transaction.create([{
        userId: toUserId,
        type: transactionType,
        amount,
        status: 'completed',
        reference: `${reference}-IN`,
        description: `${description} (Received)`,
        metadata: {
          senderId: fromUserId
        }
      }], { session });

      await session.commitTransaction();

      return {
        success: true,
        reference,
        amount,
        sender: {
          userId: fromUserId,
          newBalance: senderWallet.balance
        },
        recipient: {
          userId: toUserId,
          newBalance: recipientWallet.balance
        }
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Withdraw funds to bank account
   */
  async withdrawToBank(
    userId: string,
    amount: number,
    bankCode: string,
    accountNumber: string,
    accountName: string
  ) {
    if (amount < 500) {
      throw new AppError('Minimum withdrawal amount is ₦500', 400);
    }

    // Verify account before proceeding
    await bankService.verifyBankAccount(bankCode, accountNumber);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check user wallet
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        throw new AppError('Wallet not found', 404);
      }

      // Verify sufficient balance
      if (wallet.balance < amount) {
        throw new AppError('Insufficient funds', 400);
      }

      // Generate reference
      const reference = `MF-WDR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      // Create transaction record (pending status initially)
      const transaction = await Transaction.create([{
        userId,
        type: 'withdrawal',
        amount,
        status: 'pending',
        reference,
        description: `Withdrawal to ${accountName} (${accountNumber})`,
        metadata: {
          bankCode,
          accountNumber,
          accountName
        }
      }], { session });

      // Deduct from wallet
      wallet.balance -= amount;
      await wallet.save({ session });

      // Update user model balance
      const user = await User.findById(userId);
      if (user) {
        user.walletBalance -= amount;
        await user.save({ session });
      }

      await session.commitTransaction();

      // Process transfer (outside transaction since it's an external API call)
      try {
        const result = await paymentService.transferFunds(
          reference,
          amount,
          bankCode,
          accountNumber,
          accountName,
          `MicroFund withdrawal for ${user?.email || userId}`
        );

        if (result.success) {
          // Update transaction to completed
          await Transaction.findOneAndUpdate(
            { reference },
            { 
              status: 'completed',
              metadata: {
                ...transaction[0].metadata,
                transferReference: result.data.nip_transaction_reference
              }
            }
          );

          return {
            success: true,
            transaction: {
              ...transaction[0].toObject(),
              status: 'completed'
            },
            transferDetails: result.data
          };
        } else {
          // Handle failed transfer
          // In a real implementation, you might need a background job to retry or manual intervention
          await this.reverseWithdrawal(userId, amount, reference);
          
          throw new AppError('Fund transfer failed', 500);
        }
      } catch (error) {
        // Reverse the withdrawal if transfer fails
        await this.reverseWithdrawal(userId, amount, reference);
        throw error;
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reverse a withdrawal (private helper method)
   */
  private async reverseWithdrawal(userId: string, amount: number, reference: string) {
    try {
      // Update transaction status
      await Transaction.findOneAndUpdate(
        { reference },
        { status: 'failed' }
      );

      // Refund the wallet
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          wallet.balance += amount;
          await wallet.save({ session });
        }

        const user = await User.findById(userId);
        if (user) {
          user.walletBalance += amount;
          await user.save({ session });
        }

        // Create refund transaction record
        await Transaction.create([{
          userId,
          type: 'refund',
          amount,
          status: 'completed',
          reference: `${reference}-REFUND`,
          description: `Refund for failed withdrawal (${reference})`,
          metadata: {
            originalReference: reference
          }
        }], { session });

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error('Error reversing withdrawal:', error);
      // In production, this would trigger an alert for manual intervention
    }
  }

  /**
   * Create payment link for funding
   */
  async createPaymentLink(
    userId: string,
    amount: number,
    description: string
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (amount < 100) {
      throw new AppError('Minimum amount is ₦100', 400);
    }

    // Generate unique hash for payment link
    const hash = `mf-${userId.substring(0, 8)}-${Date.now()}`;
    
    // Create payment link
    const result = await paymentService.createPaymentLink(
      `${user.fullName}'s MicroFund Deposit`,
      hash,
      amount,
      description || `Deposit to ${user.fullName}'s MicroFund wallet`
    );

    if (!result.success) {
      throw new AppError('Failed to create payment link', 500);
    }

    // Create transaction record
    const reference = `MF-LNK-${Date.now()}-${userId.substring(0, 5)}`;
    await Transaction.create({
      userId,
      type: 'deposit',
      amount,
      status: 'pending',
      reference,
      description: `Payment link deposit: ${description || 'Wallet funding'}`,
      metadata: {
        paymentLinkHash: hash,
        paymentLinkUrl: result.paymentUrl || `https://sandbox-pay.squadco.com/${hash}`
      }
    });

    return {
      success: true,
      reference,
      paymentLink: result.paymentUrl || `https://sandbox-pay.squadco.com/${hash}`,
      hash,
      amount,
      description
    };
  }
}

// Export as singleton
export const walletService = new WalletService();