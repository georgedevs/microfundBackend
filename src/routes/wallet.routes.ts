import { Router } from 'express';
import { 
  getWallet, 
  initiateDeposit, 
  verifyDeposit, 
  getTransactionHistory 
} from '@/controllers/wallet.controller';
import { withdrawToBank } from '@/controllers/withdraw.controller';
import { createPaymentLink } from '@/controllers/payment-link.controller';
import { createVirtualAccount } from '@/controllers/virtualAccount.controller';
import { 
  completeMockPayment, 
  getMockPaymentStatus,
  mockVerifyAccount,
  mockWithdrawal
} from '@/controllers/mock.controller';
import { protect } from '@/config/auth';

const walletRoutes = Router();

// All wallet routes need authentication except mock status
walletRoutes.use(protect);

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
walletRoutes.get('/', getWallet);

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
walletRoutes.post('/deposit', initiateDeposit);

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
walletRoutes.get('/deposit/:reference', verifyDeposit);

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
 *           enum: [deposit, withdrawal, investment, return, group_contribution, group_distribution, virtual_account_deposit]
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
walletRoutes.get('/transactions', getTransactionHistory);

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
walletRoutes.post('/withdraw', withdrawToBank);

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
walletRoutes.post('/payment-link', createPaymentLink);

/**
 * @swagger
 * /wallet/virtual-account:
 *   post:
 *     summary: Create a virtual account for the user
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Virtual account created successfully
 *       400:
 *         description: User already has a virtual account
 *       401:
 *         description: Not authorized
 */
walletRoutes.post('/virtual-account', createVirtualAccount);

// Add mock routes for development and testing
if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_PAYMENT === 'true') {
  // Skip auth for mock payment status
  walletRoutes.get('/mock-payment-status/:reference', getMockPaymentStatus);
  
  // Complete a mock payment
  walletRoutes.post('/mock-payment/:reference', completeMockPayment);
  
  // Mock account verification
  walletRoutes.post('/mock-verify-account', mockVerifyAccount);

  walletRoutes.post('/mock-withdraw', protect, mockWithdrawal);
}

export default walletRoutes;