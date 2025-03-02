import { squadPaymentService } from '../squad.service';
import { mockSquadPaymentService } from '../mock-squad.service';

// Determine which service to use
const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';

// Export the appropriate payment service
export const paymentService = useMockPayment 
  ? mockSquadPaymentService 
  : squadPaymentService;

console.log(`Using ${useMockPayment ? 'MOCK' : 'REAL'} payment service`);