import axios from 'axios';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import Transaction from '@/models/Transaction';
import AppError from '@/utils/error';
import crypto from 'crypto';
import mongoose from 'mongoose';

export class VirtualAccountService {
  private apiUrl: string;
  private secretKey: string;
  private merchantId: string;

  constructor() {
    this.apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api-d.squadco.com/virtual-account' 
      : 'https://sandbox-api-d.squadco.com/virtual-account';
      
    this.secretKey = process.env.NODE_ENV === 'production'
      ? process.env.SQUAD_SECRET_KEY || ''
      : process.env.SQUAD_SANDBOX_SECRET_KEY || '';
      
    this.merchantId = process.env.NODE_ENV === 'production'
      ? process.env.SQUAD_MERCHANT_ID || ''
      : process.env.SQUAD_SANDBOX_MERCHANT_ID || '';
  }

  /**
   * Create a virtual account for a user
   */
  async createVirtualAccount(userId: string) {
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Check if wallet already has a virtual account
    if (wallet.accountNumber) {
      throw new AppError('User already has a virtual account', 400);
    }

    try {
      // Extract first and last name
      const nameParts = user.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      // Create request payload
      const payload = {
        customer_identifier: `MF-${userId.substring(0, 6)}`,
        first_name: firstName,
        last_name: lastName,
        mobile_num: user.phoneNumber || "08000000000", // Use user's phone if available
        email: user.email,
        bvn: process.env.SQUAD_TEST_BVN || "22222222222", // Use test BVN in sandbox
        dob: "30/10/1990", // Default date of birth
        address: `${user.institution || "MicroFund User"}`,
        gender: "1", // 1 for male as default
        beneficiary_account: process.env.SQUAD_SETTLEMENT_ACCOUNT // Settlement account
      };

      // Call Squad API
      const response = await axios.post(
        this.apiUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.status === 200) {
        const virtualAccountData = response.data.data;
        
        // Update wallet with virtual account details
        wallet.squadVirtualAccountId = virtualAccountData.customer_identifier;
        wallet.accountNumber = virtualAccountData.virtual_account_number;
        wallet.accountName = `${virtualAccountData.first_name} ${virtualAccountData.last_name}`;
        wallet.bankName = "Squad Microfinance Bank"; // Squad always uses this bank
        
        await wallet.save();
        
        return {
          success: true,
          data: {
            accountNumber: wallet.accountNumber,
            accountName: wallet.accountName,
            bankName: wallet.bankName
          }
        };
      } else {
        throw new AppError(
          response.data?.message || 'Failed to create virtual account',
          response.data?.status || 400
        );
      }
    } catch (error) {
      console.error('Error creating virtual account:', error.response?.data || error.message);
      
      if (error.response && error.response.data) {
        throw new AppError(
          error.response.data.message || 'Error creating virtual account',
          error.response.status || 500
        );
      } 
      
      throw new AppError('Network error connecting to payment provider', 500);
    }
  }

  /**
   * Handle virtual account webhook
   */
  async handleVirtualAccountWebhook(payload: any) {
    const {
      transaction_reference,
      virtual_account_number,
      principal_amount,
      customer_identifier,
      transaction_date,
      remarks,
      currency,
      sender_name
    } = payload;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find wallet by virtual account number
      const wallet = await Wallet.findOne({ accountNumber: virtual_account_number });
      
      if (!wallet) {
        console.error(`Virtual account not found: ${virtual_account_number}`);
        await session.abortTransaction();
        return { success: false, message: 'Virtual account not found' };
      }

      // Check if transaction already processed
      const existingTransaction = await Transaction.findOne({ 
        reference: transaction_reference,
        type: 'virtual_account_deposit'
      });

      if (existingTransaction) {
        await session.abortTransaction();
        return { 
          success: true, 
          message: 'Transaction already processed',
          data: existingTransaction
        };
      }

      // Parse amount
      const amount = parseFloat(principal_amount);
      
      // Create transaction
      const transaction = await Transaction.create([{
        userId: wallet.userId,
        type: 'virtual_account_deposit',
        amount,
        status: 'completed',
        reference: transaction_reference,
        description: `Virtual account deposit: ${sender_name || 'Unknown'} (${remarks})`,
        metadata: {
          virtualAccountNumber: virtual_account_number,
          transactionDate: transaction_date,
          senderName: sender_name,
          remarks
        }
      }], { session });

      // Update wallet balance
      wallet.balance += amount;
      await wallet.save({ session });

      // Update user model balance
      const user = await User.findById(wallet.userId);
      if (user) {
        user.walletBalance += amount;
        await user.save({ session });
      }

      await session.commitTransaction();

      return {
        success: true,
        message: 'Virtual account deposit processed',
        data: transaction[0]
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Error processing virtual account webhook:', error);
      return { success: false, message: 'Error processing webhook' };
    } finally {
      session.endSession();
    }
  }

  /**
   * Get webhook error logs
   */
  async getWebhookErrorLogs() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/webhook/logs`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (response.data && response.data.status === 200) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to fetch webhook logs',
        };
      }
    } catch (error) {
      console.error('Error fetching webhook logs:', error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.message || 'Error fetching webhook logs',
        error.response?.status || 500
      );
    }
  }

  /**
   * Delete webhook error log
   */
  async deleteWebhookErrorLog(transactionRef: string) {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/webhook/logs/${transactionRef}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (response.data && response.data.status === 200) {
        return {
          success: true,
          message: 'Webhook log deleted successfully'
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to delete webhook log',
        };
      }
    } catch (error) {
      console.error('Error deleting webhook log:', error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.message || 'Error deleting webhook log',
        error.response?.status || 500
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature: string, payload: any): boolean {
    try {
      const hmac = crypto.createHmac('sha512', this.secretKey);
      const computedSignature = hmac
        .update(JSON.stringify(payload))
        .digest('hex')
        .toLowerCase();
        
      return signature.toLowerCase() === computedSignature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

// Export as singleton
export const virtualAccountService = new VirtualAccountService();