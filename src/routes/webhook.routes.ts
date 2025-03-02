import { Router } from 'express';
import { handleSquadWebhook } from '@/controllers/webhook/squad.webhook';
import { handleVirtualAccountWebhook } from '@/controllers/virtualAccount.controller';
import { squadWebhookValidator } from '@/middleware/squadWebhookValidator';
import { ipWhitelist } from '@/middleware/ipWhitelist';

const webhookRoutes = Router();

// Whitelist Squad's webhook IP as specified in the documentation
const SQUAD_WEBHOOK_IP = '18.133.63.109';

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
 *       403:
 *         description: IP not whitelisted
 */
webhookRoutes.post(
  '/squad', 
  ipWhitelist([SQUAD_WEBHOOK_IP]), 
  squadWebhookValidator, 
  handleSquadWebhook
);

/**
 * @swagger
 * /webhooks/virtual-account:
 *   post:
 *     summary: Squad virtual account webhook endpoint
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
 *       403:
 *         description: IP not whitelisted
 */
webhookRoutes.post(
  '/virtual-account', 
  ipWhitelist([SQUAD_WEBHOOK_IP]), 
  squadWebhookValidator, 
  handleVirtualAccountWebhook
);

export default webhookRoutes;