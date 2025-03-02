"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSquadWebhook = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const squad_service_1 = require("@/services/squad.service");
const wallet_service_1 = require("@/services/wallet.service");
const Transaction_1 = __importDefault(require("@/models/Transaction"));
/**
 * Handle Squad payment webhook
 * @route POST /api/webhooks/squad
 * @access Public
 */
exports.handleSquadWebhook = (0, catchAsyncError_1.catchAsyncError)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the signature from headers
    const signature = req.headers['x-squad-encrypted-body'];
    if (!signature) {
        console.warn('Missing signature in Squad webhook');
        return res.status(400).json({ success: false, message: 'Missing signature' });
    }
    // Verify signature
    const isValid = squad_service_1.squadPaymentService.verifyWebhookSignature(signature, req.body);
    if (!isValid) {
        console.warn('Invalid signature in Squad webhook');
        return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
    const { event_type, data } = req.body;
    console.log(`Received webhook: ${event_type}`);
    // Handle different event types
    switch (event_type) {
        case 'charge.completed':
            // Process successful payment
            yield processSuccessfulPayment(data);
            break;
        default:
            console.log(`Unhandled webhook event: ${event_type}`);
    }
    // Always return 200 to acknowledge receipt
    return res.status(200).json({ success: true, message: 'Webhook received' });
}));
/**
 * Process successful payment
 */
function processSuccessfulPayment(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { reference } = data;
        // Find transaction by reference
        const transaction = yield Transaction_1.default.findOne({ reference });
        if (!transaction) {
            console.warn(`Transaction not found for reference: ${reference}`);
            return;
        }
        // Verify and process the deposit
        yield wallet_service_1.walletService.verifyDeposit(reference);
    });
}
