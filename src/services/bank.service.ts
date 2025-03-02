import Bank from '@/models/Bank';
import { paymentService } from './payment';
import AppError from '@/utils/error';

export class BankService {
  /**
   * Seed banks data
   */
  async seedBanks() {
    const banksCount = await Bank.countDocuments();
    
    if (banksCount > 0) {
      return;
    }
    
    // List of common Nigerian banks
    const banks = [
      { code: '000001', name: 'Sterling Bank' },
      { code: '000002', name: 'Keystone Bank' },
      { code: '000003', name: 'FCMB' },
      { code: '000004', name: 'United Bank for Africa' },
      { code: '000005', name: 'Diamond Bank' },
      { code: '000006', name: 'JAIZ Bank' },
      { code: '000007', name: 'Fidelity Bank' },
      { code: '000008', name: 'Polaris Bank' },
      { code: '000009', name: 'Citibank' },
      { code: '000010', name: 'Ecobank' },
      { code: '000011', name: 'Unity Bank' },
      { code: '000012', name: 'StanbicIBTC' },
      { code: '000013', name: 'GTBank' },
      { code: '000014', name: 'Access Bank' },
      { code: '000015', name: 'Zenith Bank' },
      { code: '000016', name: 'First Bank' },
      { code: '000017', name: 'Wema Bank' },
      // Add more banks as needed
    ];
    
    await Bank.insertMany(banks);
    console.log('Banks seeded successfully');
  }

  /**
   * Get all banks
   */
  async getAllBanks() {
    return Bank.find({ isActive: true }).sort({ name: 1 });
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(bankCode: string, accountNumber: string) {
    // Validate inputs
    if (!bankCode || !accountNumber) {
      throw new AppError('Bank code and account number are required', 400);
    }
    
    if (accountNumber.length !== 10) {
      throw new AppError('Account number must be 10 digits', 400);
    }
    
    // Verify bank exists
    const bank = await Bank.findOne({ code: bankCode });
    if (!bank) {
      throw new AppError('Invalid bank code', 400);
    }
    
    try {
      // Use payment service to verify account
      const result = await paymentService.lookupBankAccount(bankCode, accountNumber);
      return result.data;
    } catch (error) {
      console.error('Error verifying bank account:', error);
      throw new AppError('Error verifying account: ' + (error.message || 'Unknown error'), 500);
    }
  }
}

// Export as singleton
export const bankService = new BankService();