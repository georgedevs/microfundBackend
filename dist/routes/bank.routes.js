"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bank_controller_1 = require("@/controllers/bank/bank.controller");
const auth_1 = require("@/config/auth");
const bankRoutes = (0, express_1.Router)();
// Add this route for development
if (process.env.NODE_ENV === 'development') {
    bankRoutes.post('/seed', bank_controller_1.seedBanks);
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
bankRoutes.get('/', bank_controller_1.getAllBanks);
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
bankRoutes.post('/verify-account', auth_1.protect, bank_controller_1.verifyBankAccount);
exports.default = bankRoutes;
