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
exports.getTransactionHistory = exports.verifyDeposit = exports.initiateDeposit = exports.getWallet = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const wallet_service_1 = require("@/services/wallet.service");
const error_1 = __importDefault(require("@/utils/error"));
/**
 * Get wallet details and balance
 * @route GET /api/wallet
 * @access Private
 */
exports.getWallet = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield wallet_service_1.walletService.getWalletDetails(userId);
    res.status(200).json({
        success: true,
        data: result
    });
}));
/**
 * Initiate deposit to wallet
 * @route POST /api/wallet/deposit
 * @access Private
 */
exports.initiateDeposit = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
        return next(new error_1.default('Please provide a valid amount', 400));
    }
    const result = yield wallet_service_1.walletService.initiateDeposit(userId, amount);
    res.status(200).json({
        success: true,
        data: {
            reference: result.reference,
            checkoutUrl: result.checkoutUrl,
            message: 'Deposit initiated. Please complete payment.'
        }
    });
}));
/**
 * Verify deposit to wallet
 * @route GET /api/wallet/deposit/:reference
 * @access Private
 */
exports.verifyDeposit = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { reference } = req.params;
    const result = yield wallet_service_1.walletService.verifyDeposit(reference);
    if (!result.success) {
        return res.status(200).json({
            success: false,
            message: 'Payment verification failed',
            data: {
                transaction: result.transaction,
                merchant_info: result.merchant_info
            }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
            transaction: result.transaction,
            merchant_info: result.merchant_info
        }
    });
}));
/**
 * Get transaction history
 * @route GET /api/wallet/transactions
 * @access Private
 */
exports.getTransactionHistory = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield wallet_service_1.walletService.getTransactionHistory(userId, req.query);
    res.status(200).json({
        success: true,
        data: result
    });
}));
