import axios from 'axios';
import crypto from 'crypto';
import AppError from '@/utils/error';

export class SquadPaymentService {
  private apiUrl: string;
  private secretKey: string;
  private publicKey: string;
  private merchantId: string;
  private callbackUrl: string;
  private redirectUrl: string;

  constructor() {
  this.apiUrl = process.env.NODE_ENV === 'production' 
    ? 'https://api-d.squadco.com' 
    : 'https://sandbox-api-d.squadco.com';
    
  this.secretKey = process.env.NODE_ENV === 'production'
    ? process.env.SQUAD_SECRET_KEY
    : process.env.SQUAD_SANDBOX_SECRET_KEY || process.env.SQUAD_SECRET_KEY;
    
  this.publicKey = process.env.NODE_ENV === 'production'
    ? process.env.SQUAD_PUBLIC_KEY
    : process.env.SQUAD_SANDBOX_PUBLIC_KEY || process.env.SQUAD_PUBLIC_KEY;
    this.merchantId = process.env.SQUAD_MERCHANT_ID || 'SBN1EBZEQ8';
    this.callbackUrl = process.env.SQUAD_CALLBACK_URL || 'http://localhost:5000/api/webhooks/squad';
    this.redirectUrl = process.env.SQUAD_REDIRECT_URL || 'http://localhost:3000/payment/success';
  }

 /**
 * Initialize a payment transaction
 */
 async initializeTransaction(amount, email, reference, customerName, metadata = {}) {
  try {
    console.log(`Initializing Squad transaction: ${amount} for ${email}`);
    
    const response = await axios.post(
      `${this.apiUrl}/transaction/initiate`,
      {
        amount: amount * 100, // Convert to kobo
        email,
        currency: "NGN",
        initiate_type: "inline",
        transaction_ref: reference,
        callback_url: this.callbackUrl,
        customer_name: customerName,
        metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // Increase timeout to 15s
      }
    );

    if (response.data && response.data.status === 200) {
      return {
        success: true,
        checkoutUrl: response.data.data.checkout_url,
        reference,
      };
    }

    console.error('Squad API Error:', response.data);
    throw new AppError(
      response.data?.message || 'Failed to initialize payment',
      response.data?.status || 400
    );
  } catch (error) {
    console.error('Error initializing transaction:', error.response?.data || error.message);
    
    if (error.response) {
      throw new AppError(
        error.response.data?.message || 'Error initializing transaction',
        error.response.status || 500
      );
    } 
    
    throw new AppError('Network error connecting to payment provider', 500);
  }
}

  /**
   * Verify a transaction status
   */
  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (response.data && response.data.status === 200) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Transaction verification failed',
      };
    } catch (error: any) {
      console.error('Error verifying transaction:', error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.message || 'Error verifying transaction',
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
      const expectedSignature = hmac
      .update(JSON.stringify(payload))
      .digest('hex')
      .toUpperCase();
    return signature.toUpperCase() === expectedSignature;
    
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Account Lookup API
   */
  async lookupBankAccount(bankCode: string, accountNumber: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/payout/account/lookup`,
        {
          bank_code: bankCode,
          account_number: accountNumber
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.status === 200) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      throw new AppError(
        response.data?.message || 'Account lookup failed',
        response.data?.status || 400
      );
    } catch (error: any) {
      console.error('Error looking up account:', error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.message || 'Error looking up account',
        error.response?.status || 500
      );
    }
  }

  /**
   * Fund Transfer API
   */
  async transferFunds(
    transactionReference: string,
    amount: number, // in naira
    bankCode: string,
    accountNumber: string,
    accountName: string,
    remark: string
  ) {
    try {
      // Append merchant ID to transaction reference as required by Squad
      const fullReference = `${this.merchantId}_${transactionReference}`;
      
      const response = await axios.post(
        `${this.apiUrl}/payout/transfer`,
        {
          transaction_reference: fullReference,
          amount: (amount * 100).toString(), // Convert to kobo string
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName,
          currency_id: "NGN",
          remark
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.status === 200) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      throw new AppError(
        response.data?.message || 'Fund transfer failed',
        response.data?.status || 400
      );
    } catch (error: any) {
      console.error('Error transferring funds:', error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.message || 'Error transferring funds',
        error.response?.status || 500
      );
    }
  }

  /**
   * Create Payment Link API
   */
// In squad.service.ts - createPaymentLink method
async createPaymentLink(name, hash, amount, description, redirectLink = this.redirectUrl) {
  try {
    // Set expiry date to 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const response = await axios.post(
      `${this.apiUrl}/payment_link/otp`,
      {
        name,
        hash,
        link_status: 1, // Active
        expire_by: expiryDate.toISOString(),
        amounts: [
          {
            amount: amount * 100, // Convert to kobo
            currency_id: "NGN"
          }
        ],
        description,
        redirect_link: redirectLink,
        return_msg: "Payment successful"
      },
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000 // Add timeout to prevent hanging requests
      }
    );

    if (response.data && response.data.status === 200) {
      // Construct the payment URL based on environment
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://pay.squadco.com/' 
        : 'https://sandbox-pay.squadco.com/';
      
      return {
        success: true,
        data: response.data.data,
        paymentUrl: `${baseUrl}${hash}`
      };
    }

    console.error('Squad API Error (Payment Link):', response.data);
    return {
      success: false,
      message: response.data?.message || 'Payment link creation failed',
      data: response.data
    };
  } catch (error) {
    console.error('Error creating payment link:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Error creating payment link',
      error
    };
  }
}
}

// Export as singleton
export const squadPaymentService = new SquadPaymentService();