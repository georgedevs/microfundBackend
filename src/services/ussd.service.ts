// services/ussd.service.ts
import axios from 'axios';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Wallet from '@/models/Wallet';
import AppError from '@/utils/error';
import mongoose from 'mongoose';

export class USSDService {
  private apiUrl: string;
  private secretKey: string;

  constructor() {
    this.apiUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.SQUAD_API_URL}/transaction/initiate/process-payment` 
      : `${process.env.SQUAD_API_URL}/transaction/initiate/process-payment`;
      
    this.secretKey = process.env.SQUAD_SECRET_KEY || '';
  }

  /**
   * Initiate USSD payment
   */
  async initiateUSSDPayment(userId: string, amount: number, bankCode: string) {
    if (!amount || !bankCode) {
      throw new AppError('Amount and bank code are required', 400);
    }

    if (amount < 100) {
      throw new AppError('Minimum amount is ₦100', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate unique reference
    const reference = `MF-USSD-${Date.now()}-${userId.substring(0, 5)}`;

    try {
      // Create the request payload
      const payload = {
        transaction_reference: reference,
        amount: amount,
        pass_charge: false,
        currency: "NGN",
        ussd: {
          bank_code: bankCode
        },
        payment_method: "ussd",
        customer: {
          name: user.fullName,
          email: user.email
        }
      };

      // Call Squad API to initiate USSD payment
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
        // Create a transaction record
        await Transaction.create({
          userId,
          type: 'ussd_deposit',
          amount,
          status: 'pending',
          reference,
          description: 'USSD deposit',
          metadata: {
            bankCode,
            ussdCode: response.data.data.ussd_details.ussd_reference,
            expiresAt: response.data.data.ussd_details.expiresAt,
            gatewayRef: response.data.data.gateway_ref
          }
        });

        return {
          success: true,
          reference,
          ussdCode: response.data.data.ussd_details.ussd_reference,
          expiresAt: response.data.data.ussd_details.expiresAt,
          message: response.data.data.message
        };
      } else {
        throw new AppError('Failed to initiate USSD payment', 500);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        throw new AppError(error.response.data.message || 'Error initiating USSD payment', error.response.status || 500);
      }
      throw new AppError('Error connecting to payment provider', 500);
    }
  }

  /**
   * Verify USSD payment
   */
  async verifyUSSDPayment(reference: string) {
    const transaction = await Transaction.findOne({ reference, type: 'ussd_deposit' });
    
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    // If transaction is already completed, return the existing data
    if (transaction.status === 'completed') {
      return {
        success: true,
        verified: true,
        transaction
      };
    }

    try {
      // Call Squad verify transaction API
      const verifyUrl = process.env.NODE_ENV === 'production'
        ? 'https://api-d.squadco.com/transaction/verify'
        : 'https://sandbox-api-d.squadco.com/transaction/verify';

      const response = await axios.get(
        `${verifyUrl}/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (response.data && response.data.status === 200) {
        const verificationData = response.data.data;

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

            // Update user model balance
            const user = await User.findById(transaction.userId);
            if (!user) {
              throw new AppError('User not found', 404);
            }

            user.walletBalance += transaction.amount;
            await user.save({ session });

            await session.commitTransaction();
            
            return { 
              success: true, 
              verified: true, 
              transaction 
            };
          } catch (error) {
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
        } else {
          // Payment not yet successful
          return {
            success: true,
            verified: false,
            status: verificationData.transaction_status,
            transaction
          };
        }
      } else {
        return {
          success: false,
          verified: false,
          message: 'Error verifying payment',
          transaction
        };
      }
    } catch (error) {
      if (error.response && error.response.data) {
        throw new AppError(error.response.data.message || 'Error verifying USSD payment', error.response.status || 500);
      }
      throw new AppError('Error connecting to payment provider', 500);
    }
  }

  /**
   * Get supported banks with USSD codes
   */
  async getSupportedBanks() {
    // Return the list of supported banks from Squad documentation
    return [
      { name: "Access (Diamond) Bank", code: "063", ussdCode: "426" },
      { name: "Access Bank", code: "044", ussdCode: "901" },
      { name: "EcoBank", code: "050", ussdCode: "326" },
      { name: "First City Monument Bank (FCMB)", code: "214", ussdCode: "329" },
      { name: "Fidelity Bank", code: "070", ussdCode: "770" },
      { name: "First Bank", code: "011", ussdCode: "894" },
      { name: "Guaranty Trust Bank", code: "058", ussdCode: "737" },
      { name: "Heritage Bank", code: "030", ussdCode: "745" },
      { name: "Keystone Bank", code: "082", ussdCode: "7111" },
      { name: "Rubies (Highstreet) MFB", code: "125", ussdCode: "779" },
      { name: "Stanbic IBTC Bank", code: "221", ussdCode: "909" },
      { name: "Sterling Bank", code: "232", ussdCode: "822" },
      { name: "United Bank for Africa (UBA)", code: "033", ussdCode: "919" },
      { name: "Union Bank", code: "032", ussdCode: "826" },
      { name: "Unity Bank", code: "215", ussdCode: "7799" },
      { name: "VFD Bank", code: "566", ussdCode: "5037" },
      { name: "Wema Bank", code: "035", ussdCode: "945" },
      { name: "Zenith Bank", code: "057", ussdCode: "966" }
    ];
  }
}

// Export as singleton
export const ussdService = new USSDService();