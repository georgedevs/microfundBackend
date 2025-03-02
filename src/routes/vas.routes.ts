// routes/vas.routes.ts
import { Router } from 'express';
import { 
  getDataBundles,
  purchaseAirtime,
  purchaseData,
  getVASTransactions
} from '@/controllers/vas.controller';
import { protect } from '@/config/auth';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /vas/data-bundles:
 *   get:
 *     summary: Get available data bundles
 *     tags: [Value Added Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [MTN, GLO, AIRTEL, 9MOBILE]
 *         required: true
 *         description: Network provider
 *     responses:
 *       200:
 *         description: List of available data bundles
 *       400:
 *         description: Network parameter is missing
 *       401:
 *         description: Not authorized
 */
router.get('/data-bundles', getDataBundles);

/**
 * @swagger
 * /vas/airtime:
 *   post:
 *     summary: Purchase airtime
 *     tags: [Value Added Services]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - amount
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number to recharge
 *                 example: "08012345678"
 *               amount:
 *                 type: number
 *                 description: Amount of airtime to purchase
 *                 example: 500
 *     responses:
 *       200:
 *         description: Airtime purchased successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/airtime', purchaseAirtime);

/**
 * @swagger
 * /vas/data:
 *   post:
 *     summary: Purchase data bundle
 *     tags: [Value Added Services]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - planCode
 *               - amount
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number to subscribe
 *                 example: "08012345678"
 *               planCode:
 *                 type: string
 *                 description: Data plan code
 *                 example: "1001"
 *               amount:
 *                 type: number
 *                 description: Amount for the data plan
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Data purchased successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/data', purchaseData);

/**
 * @swagger
 * /vas/transactions:
 *   get:
 *     summary: Get VAS transaction history
 *     tags: [Value Added Services]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: VAS transaction history
 *       401:
 *         description: Not authorized
 */
router.get('/transactions', getVASTransactions);

export default router;