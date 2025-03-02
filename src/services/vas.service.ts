// services/vas.service.ts
import axios from 'axios';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import Transaction from '@/models/Transaction';
import AppError from '@/utils/error';
import mongoose from 'mongoose';

export class VASService {
  private apiUrl: string;
  private secretKey: string;

  constructor() {
    this.apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api-d.squadco.com/vending' 
      : 'https://sandbox-api-d.squadco.com/vending';
      
    this.secretKey = process.env.NODE_ENV === 'production'
      ? process.env.SQUAD_SECRET_KEY || ''
      : process.env.SQUAD_SANDBOX_SECRET_KEY || '';
  }

  /**
   * Purchase airtime
   */
  async purchaseAirtime(userId: string, phoneNumber: string, amount: number) {
    if (!phoneNumber || !amount) {
      throw new AppError('Phone number and amount are required', 400);
    }

    if (amount < 50) {
      throw new AppError('Minimum airtime amount is ₦50', 400);
    }

    // Verify phone number format
    if (!/^0[789][01]\d{8}$/.test(phoneNumber)) {
      throw new AppError('Please provide a valid Nigerian phone number', 400);
    }

    // Check if user has sufficient balance
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    if (wallet.balance < amount) {
      throw new AppError('Insufficient funds in your wallet', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create transaction record (pending)
      const reference = `MF-AIR-${Date.now()}-${userId.substring(0, 5)}`;
      
      const transaction = await Transaction.create([{
        userId,
        type: 'airtime',
        amount,
        status: 'pending',
        reference,
        description: `Airtime purchase for ${phoneNumber}`,
        metadata: {
          phoneNumber
        }
      }], { session });

      // Deduct from wallet balance
      wallet.balance -= amount;
      await wallet.save({ session });

      // Update user model balance
      const user = await User.findById(userId);
      if (user) {
        user.walletBalance -= amount;
        await user.save({ session });
      }

      await session.commitTransaction();

      // Call Squad API to purchase airtime
      try {
        const response = await axios.post(
          `${this.apiUrl}/purchase/airtime`,
          {
            phone_number: phoneNumber,
            amount: amount
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data && response.data.status === 200) {
          // Update transaction status
          await Transaction.findOneAndUpdate(
            { reference },
            { 
              status: 'completed',
              metadata: {
                ...transaction[0].metadata,
                apiResponse: response.data
              }
            }
          );

          return {
            success: true,
            message: 'Airtime purchased successfully',
            transaction: {
              ...transaction[0].toObject(),
              status: 'completed'
            },
            apiResponse: response.data
          };
        } else {
          // Handle API error
          await this.reverseTransaction(userId, amount, reference, 'Failed to purchase airtime');
          throw new AppError('Failed to purchase airtime', 500);
        }
      } catch (error) {
        // Reverse the transaction
        await this.reverseTransaction(userId, amount, reference, 'Failed to purchase airtime');
        throw new AppError('Error purchasing airtime: ' + (error.response?.data?.message || error.message), 500);
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get data bundles
   */
  async getDataBundles(network: string) {
    if (!network) {
      throw new AppError('Network is required', 400);
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/data-bundles?network=${network}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (response.data && response.data.status === 200) {
        return response.data.data;
      } else {
        throw new AppError('Failed to fetch data bundles', 500);
      }
    } catch (error) {
      throw new AppError('Error fetching data bundles: ' + (error.response?.data?.message || error.message), 500);
    }
  }

  /**
   * Purchase data bundle
   */
  async purchaseData(userId: string, phoneNumber: string, planCode: string, amount: number) {
    if (!phoneNumber || !planCode) {
      throw new AppError('Phone number and plan code are required', 400);
    }

    // Verify phone number format
    if (!/^0[789][01]\d{8}$/.test(phoneNumber)) {
      throw new AppError('Please provide a valid Nigerian phone number', 400);
    }

    // Check if user has sufficient balance
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    if (wallet.balance < amount) {
      throw new AppError('Insufficient funds in your wallet', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create transaction record (pending)
      const reference = `MF-DATA-${Date.now()}-${userId.substring(0, 5)}`;
      
      const transaction = await Transaction.create([{
        userId,
        type: 'data',
        amount,
        status: 'pending',
        reference,
        description: `Data purchase for ${phoneNumber}`,
        metadata: {
          phoneNumber,
          planCode
        }
      }], { session });

      // Deduct from wallet balance
      wallet.balance -= amount;
      await wallet.save({ session });

      // Update user model balance
      const user = await User.findById(userId);
      if (user) {
        user.walletBalance -= amount;
        await user.save({ session });
      }

      await session.commitTransaction();

      // Call Squad API to purchase data
      try {
        const response = await axios.post(
          `${this.apiUrl}/purchase/data`,
          {
            phone_number: phoneNumber,
            plan_code: planCode,
            amount: amount
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data && response.data.status === 200) {
          // Update transaction status
          await Transaction.findOneAndUpdate(
            { reference },
            { 
              status: 'completed',
              metadata: {
                ...transaction[0].metadata,
                apiResponse: response.data
              }
            }
          );

          return {
            success: true,
            message: 'Data purchased successfully',
            transaction: {
              ...transaction[0].toObject(),
              status: 'completed'
            },
            apiResponse: response.data
          };
        } else {
          // Handle API error
          await this.reverseTransaction(userId, amount, reference, 'Failed to purchase data');
          throw new AppError('Failed to purchase data', 500);
        }
      } catch (error) {
        // Reverse the transaction
        await this.reverseTransaction(userId, amount, reference, 'Failed to purchase data');
        throw new AppError('Error purchasing data: ' + (error.response?.data?.message || error.message), 500);
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get transaction history
   */
  async getVASTransactionHistory(userId: string) {
    const transactions = await Transaction.find({
      userId,
      $or: [{ type: 'airtime' }, { type: 'data' }]
    }).sort('-createdAt');

    return transactions;
  }

  /**
   * Reverse transaction (private helper)
   */
  private async reverseTransaction(userId: string, amount: number, reference: string, reason: string) {
    try {
      // Update transaction status to failed
      await Transaction.findOneAndUpdate(
        { reference },
        { status: 'failed' }
      );
      
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Refund to wallet
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          wallet.balance += amount;
          await wallet.save({ session });
        }
        
        // Update user model balance
        const user = await User.findById(userId);
        if (user) {
          user.walletBalance += amount;
          await user.save({ session });
        }
        
        // Create refund transaction
        await Transaction.create([{
          userId,
          type: 'refund',
          amount,
          status: 'completed',
          reference: `${reference}-REFUND`,
          description: `Refund: ${reason}`,
          metadata: {
            originalReference: reference
          }
        }], { session });
        
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        console.error('Error reversing transaction:', error);
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  }
}

// Export as singleton
export const vasService = new VASService();