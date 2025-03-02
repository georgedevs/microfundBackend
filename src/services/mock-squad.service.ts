import AppError from '@/utils/error';

export class MockSquadPaymentService {
  /**
   * Initialize a simulated payment transaction
   */
  async initializeTransaction(
    amount: number,
    email: string,
    reference: string,
    customerName: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      console.log(`[MOCK] Initializing transaction of ₦${amount} for ${email} with reference ${reference}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock checkout URL (this will be a local endpoint in your frontend)
      const checkoutUrl = `http://localhost:3000/mock-payment/${reference}?amount=${amount}`;
      
      return {
        success: true,
        checkoutUrl,
        reference,
      };
    } catch (error: any) {
      console.error('[MOCK] Error simulating transaction:', error);
      throw new AppError('Error in mock payment simulation', 500);
    }
  }

  /**
   * Verify a simulated transaction status
   */
  async verifyTransaction(reference: string) {
    try {
      console.log(`[MOCK] Verifying transaction ${reference}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Always return success in mock mode
      return {
        success: true,
        data: {
          transaction_status: 'success',
          amount: 100000, // Amount in kobo
          transaction_reference: reference,
          payment_type: 'card',
          payment_status: true
        }
      };
    } catch (error: any) {
      console.error('[MOCK] Error verifying transaction:', error);
      throw new AppError('Error in mock verification', 500);
    }
  }

  /**
   * Mock webhook signature verification
   */
  verifyWebhookSignature(signature: string, payload: any): boolean {
    return true; // Always verify in mock mode
  }

  /**
   * Mock account lookup
   */
  async lookupBankAccount(bankCode: string, accountNumber: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock account info
    return {
      success: true,
      data: {
        account_name: "MOCK USER",
        account_number: accountNumber
      }
    };
  }

  /**
   * Mock fund transfer
   */
  async transferFunds(
    transactionReference: string,
    amount: number,
    bankCode: string,
    accountNumber: string,
    accountName: string,
    remark: string
  ) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        transaction_reference: transactionReference,
        response_description: "Approved or completed successfully",
        currency_id: "NGN",
        amount: amount.toString(),
        nip_transaction_reference: "123456789012345678901234567890",
        account_number: accountNumber,
        account_name: accountName,
        destination_institution_name: "Mock Bank"
      }
    };
  }

  /**
   * Mock payment link creation
   */
  async createPaymentLink(
    name: string, 
    hash: string, 
    amount: number, 
    description: string,
    redirectLink: string
  ) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Set expiry to 30 days
    
    return {
      success: true,
      data: {
        name,
        link_type: "otp",
        hash,
        description,
        redirect_link: redirectLink,
        return_msg: "Successful",
        expire_by: expiryDate.toISOString(),
        merchant_id: "MOCK_MERCHANT",
        link_status: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        amounts: [
          {
            amount,
            currency_id: "NGN"
          }
        ]
      }
    };
  }
}

// Export as singleton
export const mockSquadPaymentService = new MockSquadPaymentService();