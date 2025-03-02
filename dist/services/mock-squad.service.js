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
exports.mockSquadPaymentService = exports.MockSquadPaymentService = void 0;
const error_1 = __importDefault(require("@/utils/error"));
class MockSquadPaymentService {
    /**
     * Initialize a simulated payment transaction
     */
    initializeTransaction(amount_1, email_1, reference_1, customerName_1) {
        return __awaiter(this, arguments, void 0, function* (amount, email, reference, customerName, metadata = {}) {
            try {
                console.log(`[MOCK] Initializing transaction of ₦${amount} for ${email} with reference ${reference}`);
                // Simulate processing delay
                yield new Promise(resolve => setTimeout(resolve, 500));
                // Create mock checkout URL (this will be a local endpoint in your frontend)
                const checkoutUrl = `http://localhost:3000/mock-payment/${reference}?amount=${amount}`;
                return {
                    success: true,
                    checkoutUrl,
                    reference,
                };
            }
            catch (error) {
                console.error('[MOCK] Error simulating transaction:', error);
                throw new error_1.default('Error in mock payment simulation', 500);
            }
        });
    }
    /**
     * Verify a simulated transaction status
     */
    verifyTransaction(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[MOCK] Verifying transaction ${reference}`);
                // Simulate processing delay
                yield new Promise(resolve => setTimeout(resolve, 500));
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
            }
            catch (error) {
                console.error('[MOCK] Error verifying transaction:', error);
                throw new error_1.default('Error in mock verification', 500);
            }
        });
    }
    /**
     * Mock webhook signature verification
     */
    verifyWebhookSignature(signature, payload) {
        return true; // Always verify in mock mode
    }
    /**
     * Mock account lookup
     */
    lookupBankAccount(bankCode, accountNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(resolve => setTimeout(resolve, 500));
            // Return mock account info
            return {
                success: true,
                data: {
                    account_name: "MOCK USER",
                    account_number: accountNumber
                }
            };
        });
    }
    /**
     * Mock fund transfer
     */
    transferFunds(transactionReference, amount, bankCode, accountNumber, accountName, remark) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(resolve => setTimeout(resolve, 500));
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
        });
    }
    /**
     * Mock payment link creation
     */
    createPaymentLink(name, hash, amount, description, redirectLink) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(resolve => setTimeout(resolve, 500));
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
        });
    }
}
exports.MockSquadPaymentService = MockSquadPaymentService;
// Export as singleton
exports.mockSquadPaymentService = new MockSquadPaymentService();
