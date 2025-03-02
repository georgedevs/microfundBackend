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
exports.mockWithdrawal = exports.mockVerifyAccount = exports.getMockPaymentStatus = exports.completeMockPayment = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const wallet_service_1 = require("@/services/wallet.service");
const Transaction_1 = __importDefault(require("@/models/Transaction"));
const error_1 = __importDefault(require("@/utils/error"));
const Wallet_1 = __importDefault(require("@/models/Wallet"));
const User_1 = __importDefault(require("@/models/User"));
/**
 * Complete a simulated payment (for testing only)
 * @route POST /api/wallet/mock-payment/:reference
 * @access Private
 */
exports.completeMockPayment = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_PAYMENT !== 'true') {
        return res.status(404).json({
            success: false,
            error: 'Endpoint not available in production'
        });
    }
    const { reference } = req.params;
    // Complete the payment
    const result = yield wallet_service_1.walletService.verifyDeposit(reference);
    res.status(200).json({
        success: true,
        message: 'Mock payment completed successfully',
        data: result
    });
}));
/**
 * Get mock payment status (for frontend testing)
 * @route GET /api/wallet/mock-payment-status/:reference
 * @access Public
 */
exports.getMockPaymentStatus = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_PAYMENT !== 'true') {
        return res.status(404).json({
            success: false,
            error: 'Endpoint not available in production'
        });
    }
    const { reference } = req.params;
    const transaction = yield Transaction_1.default.findOne({ reference });
    if (!transaction) {
        return next(new error_1.default('Transaction not found', 404));
    }
    res.status(200).json({
        success: true,
        data: {
            reference,
            status: transaction.status,
            amount: transaction.amount
        }
    });
}));
/**
 * Simulate bank account verification (for testing only)
 * @route POST /api/wallet/mock-verify-account
 * @access Public
 */
exports.mockVerifyAccount = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_PAYMENT !== 'true') {
        return res.status(404).json({
            success: false,
            error: 'Endpoint not available in production'
        });
    }
    const { bankCode, accountNumber } = req.body;
    if (!bankCode || !accountNumber) {
        return next(new error_1.default('Bank code and account number are required', 400));
    }
    // Return mock data
    res.status(200).json({
        success: true,
        data: {
            account_name: "MOCK TEST ACCOUNT",
            account_number: accountNumber
        }
    });
}));
exports.mockWithdrawal = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_PAYMENT !== 'true') {
        return res.status(404).json({
            success: false,
            error: 'Endpoint not available in production'
        });
    }
    const userId = req.user.id;
    const { amount, bankCode, accountNumber, accountName } = req.body;
    if (!amount || !bankCode || !accountNumber || !accountName) {
        return next(new error_1.default('Please provide all required fields', 400));
    }
    // Get user wallet
    const wallet = yield Wallet_1.default.findOne({ userId });
    if (!wallet) {
        return next(new error_1.default('Wallet not found', 404));
    }
    // Check balance
    if (wallet.balance < amount) {
        return next(new error_1.default('Insufficient funds', 400));
    }
    // Generate reference
    const reference = `MF-WDR-MOCK-${Date.now()}`;
    // Create transaction
    const transaction = yield Transaction_1.default.create({
        userId,
        type: 'withdrawal',
        amount,
        status: 'completed',
        reference,
        description: `Mock withdrawal to ${accountName} (${accountNumber})`,
        metadata: {
            bankCode,
            accountNumber,
            accountName
        }
    });
    // Update wallet balance
    wallet.balance -= amount;
    yield wallet.save();
    // Update user model balance
    const user = yield User_1.default.findById(userId);
    if (user) {
        user.walletBalance -= amount;
        yield user.save();
    }
    res.status(200).json({
        success: true,
        message: 'Mock withdrawal processed successfully',
        data: {
            transaction,
            transferDetails: {
                transaction_reference: reference,
                response_description: "Approved or completed successfully",
                currency_id: "NGN",
                amount: amount.toString(),
                account_number: accountNumber,
                account_name: accountName,
                destination_institution_name: "Mock Bank"
            }
        }
    });
}));
