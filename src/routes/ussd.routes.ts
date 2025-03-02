// routes/ussd.routes.ts
import { Router } from 'express';
import {
  getSupportedBanks,
  initiateUSSDPayment,
  verifyUSSDPayment
} from '@/controllers/ussd.controller';
import { protect } from '@/config/auth';

const router = Router();

/**
 * @swagger
 * /ussd/banks:
 *   get:
 *     summary: Get supported banks with USSD codes
 *     tags: [USSD]
 *     responses:
 *       200:
 *         description: List of supported banks
 */
router.get('/banks', getSupportedBanks);

// Protected routes
router.use(protect);

/**
 * @swagger
 * /ussd/initiate:
 *   post:
 *     summary: Initiate USSD payment
 *     tags: [USSD]
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
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to deposit
 *                 example: 1000
 *               bankCode:
 *                 type: string
 *                 description: Bank code
 *                 example: "058"
 *     responses:
 *       200:
 *         description: USSD payment initiated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/initiate', initiateUSSDPayment);

/**
 * @swagger
 * /ussd/verify/{reference}:
 *   get:
 *     summary: Verify USSD payment
 *     tags: [USSD]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment reference
 *     responses:
 *       200:
 *         description: Payment verification result
 *       400:
 *         description: Invalid reference
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Transaction not found
 */
router.get('/verify/:reference', verifyUSSDPayment);

export default router;