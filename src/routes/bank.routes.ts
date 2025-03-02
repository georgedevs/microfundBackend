import { Router } from 'express';
import { getAllBanks, seedBanks, verifyBankAccount } from '@/controllers/bank/bank.controller';
import { protect } from '@/config/auth';
const bankRoutes = Router();


// Add this route for development
if (process.env.NODE_ENV === 'development') {
    bankRoutes.post('/seed', seedBanks);
  }
/**
 * @swagger
 * /banks:
 *   get:
 *     summary: Get all banks
 *     tags: [Banks]
 *     responses:
 *       200:
 *         description: List of all banks
 */
bankRoutes.get('/', getAllBanks);

/**
 * @swagger
 * /banks/verify-account:
 *   post:
 *     summary: Verify bank account
 *     tags: [Banks]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankCode
 *               - accountNumber
 *             properties:
 *               bankCode:
 *                 type: string
 *                 description: Bank code
 *                 example: "000013"
 *               accountNumber:
 *                 type: string
 *                 description: Account number
 *                 example: "0123456789"
 *     responses:
 *       200:
 *         description: Account verification result
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
bankRoutes.post('/verify-account', protect, verifyBankAccount);

export default bankRoutes;