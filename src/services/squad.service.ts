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
    this.apiUrl = process.env.SQUAD_API_URL || 'https://sandbox-api-d.squadco.com';
    this.secretKey = process.env.SQUAD_SECRET_KEY || '';
    this.publicKey = process.env.SQUAD_PUBLIC_KEY || '';
    this.merchantId = process.env.SQUAD_MERCHANT_ID || 'SBN1EBZEQ8';
    this.callbackUrl = process.env.SQUAD_CALLBACK_URL || 'http://localhost:5000/api/webhooks/squad';
    this.redirectUrl = process.env.SQUAD_REDIRECT_URL || 'http://localhost:3000/payment/success';
  }

 /**
 * Initialize a payment transaction
 */
async initializeTransaction(
  amount: number,
  email: string,
  reference: string,
  customerName: string,
  metadata: Record<string, any> = {}
) {
  try {
    console.log(`Initializing Squad transaction: ${amount} for ${email}`);
    
    // If mock payment is enabled, return mock data
    if (process.env.USE_MOCK_PAYMENT === 'true') {
      return {
        success: true,
        checkoutUrl: `http://localhost:3000/mock-payment/${reference}?amount=${amount}`,
        reference,
      };
    }
    
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
    // If mock payment is enabled and there's a connection error, return mock data
    if (process.env.USE_MOCK_PAYMENT === 'true' && 
       (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
      console.log('Using mock payment due to connection error');
      return {
        success: true,
        checkoutUrl: `http://localhost:3000/mock-payment/${reference}?amount=${amount}`,
        reference,
      };
    }
    
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
  async createPaymentLink(
    name: string, 
    hash: string, 
    amount: number, // in naira
    description: string,
    redirectLink: string = this.redirectUrl
  ) {
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
        }
      );

      if (response.data && response.data.status === 200) {
        return {
          success: true,
          data: response.data.data,
          paymentUrl: `https://sandbox-pay.squadco.com/${hash}`
        };
      }

      throw new AppError(
        response.data?.message || 'Payment link creation failed',
        response.data?.status || 400
      );
    } catch (error: any) {
      console.error('Error creating payment link:', error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.message || 'Error creating payment link',
        error.response?.status || 500
      );
    }
  }
}

// Export as singleton
export const squadPaymentService = new SquadPaymentService();