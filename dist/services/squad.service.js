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
exports.squadPaymentService = exports.SquadPaymentService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const error_1 = __importDefault(require("@/utils/error"));
class SquadPaymentService {
    constructor() {
        this.apiUrl = process.env.SQUAD_API_URL || 'https://sandbox-api-d.squadco.com';
        this.secretKey = process.env.SQUAD_SECRET_KEY || '';
        this.publicKey = process.env.SQUAD_PUBLIC_KEY || '';
        this.merchantId = process.env.SQUAD_MERCHANT_ID || '';
        this.callbackUrl = process.env.SQUAD_CALLBACK_URL || 'http://localhost:5000/api/webhooks/squad';
        this.redirectUrl = process.env.SQUAD_REDIRECT_URL || 'http://localhost:3000/payment/success';
    }
    /**
     * Initialize a payment transaction
     */
    initializeTransaction(amount_1, email_1, reference_1, customerName_1) {
        return __awaiter(this, arguments, void 0, function* (amount, email, reference, customerName, metadata = {}) {
            var _a, _b, _c, _d;
            try {
                console.log(`Initializing Squad transaction: ${amount} for ${email}`);
                const response = yield axios_1.default.post(`${this.apiUrl}/transaction/initiate`, {
                    amount: amount * 100, // Convert to kobo
                    email,
                    currency: "NGN",
                    initiate_type: "inline",
                    transaction_ref: reference,
                    callback_url: this.callbackUrl,
                    customer_name: customerName,
                    metadata,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.data && response.data.status === 200) {
                    return {
                        success: true,
                        checkoutUrl: response.data.data.checkout_url,
                        reference,
                    };
                }
                console.error('Squad API Error:', response.data);
                throw new error_1.default(((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to initialize payment', ((_b = response.data) === null || _b === void 0 ? void 0 : _b.status) || 400);
            }
            catch (error) {
                console.error('Error initializing transaction:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
                if (error.response) {
                    throw new error_1.default(((_d = error.response.data) === null || _d === void 0 ? void 0 : _d.message) || 'Error initializing transaction', error.response.status || 500);
                }
                throw new error_1.default('Network error connecting to payment provider', 500);
            }
        });
    }
    /**
     * Verify a transaction status
     */
    verifyTransaction(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const response = yield axios_1.default.get(`${this.apiUrl}/transaction/verify/${reference}`, {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                    },
                });
                if (response.data && response.data.status === 200) {
                    return {
                        success: true,
                        data: response.data.data,
                    };
                }
                return {
                    success: false,
                    message: ((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || 'Transaction verification failed',
                };
            }
            catch (error) {
                console.error('Error verifying transaction:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
                throw new error_1.default(((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || 'Error verifying transaction', ((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) || 500);
            }
        });
    }
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(signature, payload) {
        try {
            const hmac = crypto_1.default.createHmac('sha512', this.secretKey);
            const expectedSignature = hmac
                .update(JSON.stringify(payload))
                .digest('hex')
                .toUpperCase();
            return signature.toUpperCase() === expectedSignature;
        }
        catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }
    /**
     * Account Lookup API
     */
    lookupBankAccount(bankCode, accountNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                const response = yield axios_1.default.post(`${this.apiUrl}/payout/account/lookup`, {
                    bank_code: bankCode,
                    account_number: accountNumber
                }, {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.data && response.data.status === 200) {
                    return {
                        success: true,
                        data: response.data.data,
                    };
                }
                throw new error_1.default(((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || 'Account lookup failed', ((_b = response.data) === null || _b === void 0 ? void 0 : _b.status) || 400);
            }
            catch (error) {
                console.error('Error looking up account:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
                throw new error_1.default(((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || 'Error looking up account', ((_f = error.response) === null || _f === void 0 ? void 0 : _f.status) || 500);
            }
        });
    }
    /**
     * Fund Transfer API
     */
    transferFunds(transactionReference, amount, // in naira
    bankCode, accountNumber, accountName, remark) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                // Append merchant ID to transaction reference as required by Squad
                const fullReference = `${this.merchantId}_${transactionReference}`;
                const response = yield axios_1.default.post(`${this.apiUrl}/payout/transfer`, {
                    transaction_reference: fullReference,
                    amount: (amount * 100).toString(), // Convert to kobo string
                    bank_code: bankCode,
                    account_number: accountNumber,
                    account_name: accountName,
                    currency_id: "NGN",
                    remark
                }, {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.data && response.data.status === 200) {
                    return {
                        success: true,
                        data: response.data.data,
                    };
                }
                throw new error_1.default(((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || 'Fund transfer failed', ((_b = response.data) === null || _b === void 0 ? void 0 : _b.status) || 400);
            }
            catch (error) {
                console.error('Error transferring funds:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
                throw new error_1.default(((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || 'Error transferring funds', ((_f = error.response) === null || _f === void 0 ? void 0 : _f.status) || 500);
            }
        });
    }
    /**
     * Create Payment Link API
     */
    createPaymentLink(name_1, hash_1, amount_1, description_1) {
        return __awaiter(this, arguments, void 0, function* (name, hash, amount, // in naira
        description, redirectLink = this.redirectUrl) {
            var _a, _b, _c, _d, _e, _f;
            try {
                // Set expiry date to 30 days from now
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                const response = yield axios_1.default.post(`${this.apiUrl}/payment_link/otp`, {
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
                }, {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.data && response.data.status === 200) {
                    return {
                        success: true,
                        data: response.data.data,
                        paymentUrl: `https://sandbox-pay.squadco.com/${hash}`
                    };
                }
                throw new error_1.default(((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || 'Payment link creation failed', ((_b = response.data) === null || _b === void 0 ? void 0 : _b.status) || 400);
            }
            catch (error) {
                console.error('Error creating payment link:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
                throw new error_1.default(((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || 'Error creating payment link', ((_f = error.response) === null || _f === void 0 ? void 0 : _f.status) || 500);
            }
        });
    }
}
exports.SquadPaymentService = SquadPaymentService;
// Export as singleton
exports.squadPaymentService = new SquadPaymentService();
