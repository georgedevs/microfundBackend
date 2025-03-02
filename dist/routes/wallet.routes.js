"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("@/controllers/wallet.controller");
const withdraw_controller_1 = require("@/controllers/withdraw.controller");
const payment_link_controller_1 = require("@/controllers/payment-link.controller");
const mock_controller_1 = require("@/controllers/mock.controller");
const auth_1 = require("@/config/auth");
const walletRoutes = (0, express_1.Router)();
// All wallet routes need authentication except mock status
walletRoutes.use(auth_1.protect);
/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Get user wallet details
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User wallet details
 *       401:
 *         description: Not authorized
 */
walletRoutes.get('/', wallet_controller_1.getWallet);
/**
 * @swagger
 * /wallet/deposit:
 *   post:
 *     summary: Initiate a deposit to wallet
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to deposit
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Deposit initiated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
walletRoutes.post('/deposit', wallet_controller_1.initiateDeposit);
/**
 * @swagger
 * /wallet/deposit/{reference}:
 *   get:
 *     summary: Verify a deposit by reference
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *     responses:
 *       200:
 *         description: Deposit verification result
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Transaction not found
 */
walletRoutes.get('/deposit/:reference', wallet_controller_1.verifyDeposit);
/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, investment, return, group_contribution, group_distribution]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by transaction status
 *     responses:
 *       200:
 *         description: Transaction history
 *       401:
 *         description: Not authorized
 */
walletRoutes.get('/transactions', wallet_controller_1.getTransactionHistory);
/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Withdraw funds to bank account
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - bankCode
 *               - accountNumber
 *               - accountName
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw
 *                 example: 1000
 *               bankCode:
 *                 type: string
 *                 description: Bank code
 *                 example: "000013"
 *               accountNumber:
 *                 type: string
 *                 description: Account number
 *                 example: "0123456789"
 *               accountName:
 *                 type: string
 *                 description: Account name
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: Withdrawal processed
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
walletRoutes.post('/withdraw', withdraw_controller_1.withdrawToBank);
/**
 * @swagger
 * /wallet/payment-link:
 *   post:
 *     summary: Create payment link for funding
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount for payment link
 *                 example: 1000
 *               description:
 *                 type: string
 *                 description: Description for payment
 *                 example: "Wallet funding"
 *     responses:
 *       200:
 *         description: Payment link created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
walletRoutes.post('/payment-link', payment_link_controller_1.createPaymentLink);
// Add mock routes for development and testing
if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PAYMENT === 'true') {
    // Skip auth for mock payment status
    walletRoutes.get('/mock-payment-status/:reference', mock_controller_1.getMockPaymentStatus);
    // Complete a mock payment
    walletRoutes.post('/mock-payment/:reference', mock_controller_1.completeMockPayment);
    // Mock account verification
    walletRoutes.post('/mock-verify-account', mock_controller_1.mockVerifyAccount);
    walletRoutes.post('/mock-withdraw', auth_1.protect, mock_controller_1.mockWithdrawal);
}
exports.default = walletRoutes;
