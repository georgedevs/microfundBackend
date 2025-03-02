// routes/payment-link.routes.ts
import { Router } from 'express';
import { 
  createPaymentLink,
  getUserPaymentLinks,
  verifyPaymentLink
} from '@/controllers/payment-link.controller';
import { protect } from '@/config/auth';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /payment-links:
 *   post:
 *     summary: Create a shareable payment link
 *     tags: [Payment Links]
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
 *                 example: "Group contribution"
 *               redirectLink:
 *                 type: string
 *                 description: URL to redirect after payment
 *     responses:
 *       201:
 *         description: Payment link created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/', createPaymentLink);

/**
 * @swagger
 * /payment-links:
 *   get:
 *     summary: Get user's payment links
 *     tags: [Payment Links]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's payment links
 *       401:
 *         description: Not authorized
 */
router.get('/', getUserPaymentLinks);

/**
 * @swagger
 * /payment-links/{reference}/verify:
 *   get:
 *     summary: Verify payment link status
 *     tags: [Payment Links]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link reference
 *     responses:
 *       200:
 *         description: Payment link status
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Payment link not found
 */
router.get('/:reference/verify', verifyPaymentLink);

export default router;