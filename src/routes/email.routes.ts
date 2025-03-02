// routes/email.routes.ts
import { Router } from 'express';
import { sendTestEmail } from '@/controllers/email.controller';
import { protect } from '@/config/auth';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /email/test:
 *   post:
 *     summary: Send test email (development only)
 *     tags: [Email]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [welcome, transaction, investment, savings, education]
 *                 description: Type of test email to send
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Endpoint not available in production
 */
router.post('/test', sendTestEmail);

export default router;