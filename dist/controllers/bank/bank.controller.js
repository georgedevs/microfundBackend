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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedBanks = exports.verifyBankAccount = exports.getAllBanks = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const bank_service_1 = require("@/services/bank.service");
/**
 * Get all banks
 * @route GET /api/banks
 * @access Public
 */
exports.getAllBanks = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const banks = yield bank_service_1.bankService.getAllBanks();
    res.status(200).json({
        success: true,
        data: banks
    });
}));
/**
 * Verify bank account
 * @route POST /api/banks/verify-account
 * @access Private
 */
exports.verifyBankAccount = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { bankCode, accountNumber } = req.body;
    const accountDetails = yield bank_service_1.bankService.verifyBankAccount(bankCode, accountNumber);
    res.status(200).json({
        success: true,
        data: accountDetails
    });
}));
exports.seedBanks = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield bank_service_1.bankService.seedBanks();
    res.status(200).json({
        success: true,
        message: 'Banks seeded successfully'
    });
}));
