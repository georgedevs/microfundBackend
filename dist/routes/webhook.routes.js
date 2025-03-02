"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const squad_webhook_1 = require("@/controllers/webhook/squad.webhook");
const webhookRoutes = (0, express_1.Router)();
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
webhookRoutes.post('/squad', squad_webhook_1.handleSquadWebhook);
exports.default = webhookRoutes;
