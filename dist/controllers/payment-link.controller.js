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
exports.createPaymentLink = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const wallet_service_1 = require("@/services/wallet.service");
const error_1 = __importDefault(require("@/utils/error"));
/**
 * Create payment link for wallet funding
 * @route POST /api/wallet/payment-link
 * @access Private
 */
exports.createPaymentLink = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { amount, description } = req.body;
    if (!amount) {
        return next(new error_1.default('Please provide an amount', 400));
    }
    if (isNaN(amount) || amount <= 0) {
        return next(new error_1.default('Please provide a valid amount', 400));
    }
    const result = yield wallet_service_1.walletService.createPaymentLink(userId, amount, description || 'Wallet funding');
    res.status(200).json({
        success: true,
        message: 'Payment link created successfully',
        data: result
    });
}));
