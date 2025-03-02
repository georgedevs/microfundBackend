import { Router } from 'express';
import { handleSquadWebhook } from '@/controllers/webhook/squad.webhook';
import { squadWebhookValidator } from '@/middleware/squadWebhookValidator';

const webhookRoutes = Router();

/**
 * @swagger
 * /webhooks/squad:
 *   post:
 *     summary: Squad webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
webhookRoutes.post('/squad', squadWebhookValidator, handleSquadWebhook);

export default webhookRoutes;