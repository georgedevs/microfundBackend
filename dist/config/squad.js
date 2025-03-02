"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const squadConfig = {
    apiUrl: process.env.SQUAD_API_URL || 'https://sandbox-api-d.squadco.com',
    secretKey: process.env.SQUAD_SECRET_KEY || '',
    publicKey: process.env.SQUAD_PUBLIC_KEY || '',
    redirectUrl: process.env.SQUAD_REDIRECT_URL || 'http://localhost:3000/payment/success',
    callbackUrl: process.env.SQUAD_CALLBACK_URL || 'http://localhost:5000/api/webhooks/squad',
};
exports.default = squadConfig;
