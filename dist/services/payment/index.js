"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const squad_service_1 = require("../squad.service");
const mock_squad_service_1 = require("../mock-squad.service");
// Determine which service to use
const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';
// Export the appropriate payment service
exports.paymentService = useMockPayment
    ? mock_squad_service_1.mockSquadPaymentService
    : squad_service_1.squadPaymentService;
console.log(`Using ${useMockPayment ? 'MOCK' : 'REAL'} payment service`);
