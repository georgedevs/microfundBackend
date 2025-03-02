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
exports.withdrawToBank = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const wallet_service_1 = require("@/services/wallet.service");
const error_1 = __importDefault(require("@/utils/error"));
/**
 * Withdraw funds to bank account
 * @route POST /api/wallet/withdraw
 * @access Private
 */
exports.withdrawToBank = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { amount, bankCode, accountNumber, accountName } = req.body;
    if (!amount || !bankCode || !accountNumber || !accountName) {
        return next(new error_1.default('Please provide all required fields', 400));
    }
    if (isNaN(amount) || amount <= 0) {
        return next(new error_1.default('Please provide a valid amount', 400));
    }
    const result = yield wallet_service_1.walletService.withdrawToBank(userId, amount, bankCode, accountNumber, accountName);
    res.status(200).json({
        success: true,
        message: 'Withdrawal processed successfully',
        data: result
    });
}));
