"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bankService = exports.BankService = void 0;
const Bank_1 = __importDefault(require("@/models/Bank"));
const payment_1 = require("./payment");
const error_1 = __importDefault(require("@/utils/error"));
class BankService {
    /**
     * Seed banks data
     */
    seedBanks() {
        return __awaiter(this, void 0, void 0, function* () {
            const banksCount = yield Bank_1.default.countDocuments();
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
            yield Bank_1.default.insertMany(banks);
            console.log('Banks seeded successfully');
        });
    }
    /**
     * Get all banks
     */
    getAllBanks() {
        return __awaiter(this, void 0, void 0, function* () {
            return Bank_1.default.find({ isActive: true }).sort({ name: 1 });
        });
    }
    /**
     * Verify bank account
     */
    verifyBankAccount(bankCode, accountNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate inputs
            if (!bankCode || !accountNumber) {
                throw new error_1.default('Bank code and account number are required', 400);
            }
            if (accountNumber.length !== 10) {
                throw new error_1.default('Account number must be 10 digits', 400);
            }
            // Verify bank exists
            const bank = yield Bank_1.default.findOne({ code: bankCode });
            if (!bank) {
                throw new error_1.default('Invalid bank code', 400);
            }
            // Use payment service to verify account
            const result = yield payment_1.paymentService.lookupBankAccount(bankCode, accountNumber);
            return result.data;
        });
    }
}
exports.BankService = BankService;
// Export as singleton
exports.bankService = new BankService();
