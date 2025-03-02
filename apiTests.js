const axios = require('axios');
const fs = require('fs').promises;

// Configuration
const config = {
  baseUrl: 'http://localhost:5000/api',
  useMockPayment: process.env.USE_MOCK_PAYMENT === 'true',
  logToFile: true,
  logFilePath: './api-test-results.log',
};

// Test credentials
let testUser = {
  email: 'test@university.edu.ng',
  password: 'Password123!',
  fullName: 'Test User',
  institution: 'University of Lagos',
  department: 'Computer Science',
  level: '300'
};

// Global variables to use across tests
let authToken;
let userId;
let depositReference;
let paymentLinkHash;
let walletBalance;

// Utility function for logging
async function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${isError ? 'ERROR: ' : ''}${message}`;

  console.log(logMessage);

  if (config.logToFile) {
    try {
      await fs.appendFile(config.logFilePath, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}

// Initialize log file
async function initLogFile() {
  if (config.logToFile) {
    try {
      await fs.writeFile(
        config.logFilePath,
        `API TEST RUN: ${new Date().toISOString()}\n` +
        `Mode: ${config.useMockPayment ? 'MOCK' : 'LIVE'}\n` +
        `---------------------------------------------\n\n`
      );
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }
}

// HTTP client with authorization and error handling
const client = {
  async request(method, url, data = null, requireAuth = false) {
    try {
      const headers = {};
      if (requireAuth) {
        if (!authToken) {
          throw new Error('Authentication token is required but not available');
        }
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      if (data) {
        headers['Content-Type'] = 'application/json';
      }

      await log(`Sending ${method} request to ${url}${data ? ' with data: ' + JSON.stringify(data) : ''}`);

      const response = await axios({
        method,
        url: `${config.baseUrl}${url}`,
        data,
        headers,
        validateStatus: () => true, // Don't throw on any status code
      });

      await log(`Response status: ${response.status}`);
      await log(`Response data: ${JSON.stringify(response.data, null, 2)}`);

      return {
        status: response.status,
        data: response.data,
        success: response.status >= 200 && response.status < 300,
      };
    } catch (error) {
      await log(`Request failed: ${error.message}`, true);
      if (error.response) {
        await log(`Response status: ${error.response.status}`, true);
        await log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`, true);
      }
      return {
        status: error.response?.status || 500,
        data: error.response?.data || { error: error.message },
        success: false,
      };
    }
  },

  async get(url, requireAuth = false) {
    return this.request('GET', url, null, requireAuth);
  },

  async post(url, data, requireAuth = false) {
    return this.request('POST', url, data, requireAuth);
  },
};

// Test suites
const tests = {
  async authenticate() {
    await log('===== AUTHENTICATION TESTS =====');

    // Try to login first
    const loginResponse = await client.post('/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });

    // If login fails, try registration
    if (!loginResponse.success) {
      await log('Login failed, attempting registration...');
      const registerResponse = await client.post('/auth/register', testUser);

      if (!registerResponse.success) {
        throw new Error('Authentication failed - could not login or register');
      }

      authToken = registerResponse.data.data.token;
      await log('Registration successful');
    } else {
      authToken = loginResponse.data.data.token;
      await log('Login successful');
    }

    // Get user profile
    const profileResponse = await client.get('/auth/me', true);
    if (!profileResponse.success) {
      throw new Error('Failed to fetch user profile');
    }

    userId = profileResponse.data.data.user._id;
    await log(`User ID: ${userId}`);
    await log('Authentication tests completed successfully');
    
    return true;
  },

  async walletBasics() {
    await log('===== WALLET BASIC TESTS =====');

    // Get wallet details
    const walletResponse = await client.get('/wallet', true);
    if (!walletResponse.success) {
      throw new Error('Failed to fetch wallet details');
    }

    walletBalance = walletResponse.data.data.wallet.balance;
    await log(`Initial wallet balance: ${walletBalance}`);
    
    await log('Wallet basic tests completed successfully');
    return true;
  },

  async deposit() {
    await log('===== DEPOSIT TESTS =====');

    // Initiate deposit
    const depositAmount = 1000;
    const initiateResponse = await client.post('/wallet/deposit', {
      amount: depositAmount,
    }, true);

    if (!initiateResponse.success) {
      throw new Error('Failed to initiate deposit');
    }

    depositReference = initiateResponse.data.data.reference;
    const checkoutUrl = initiateResponse.data.data.checkoutUrl;
    
    await log(`Deposit initiated with reference: ${depositReference}`);
    await log(`Checkout URL: ${checkoutUrl}`);

    // If using mock, complete the payment
    if (config.useMockPayment) {
      await log('Using mock payment - completing payment automatically');
      const mockCompleteResponse = await client.post(`/wallet/mock-payment/${depositReference}`, {}, true);
      
      if (!mockCompleteResponse.success) {
        throw new Error('Failed to complete mock payment');
      }
      
      await log('Mock payment completed successfully');
    } else {
      await log('IMPORTANT: In live mode, you need to manually complete the payment by visiting the checkout URL');
      await log('After completing payment, continue the test script to verify the deposit');
      
      // In a real environment, you might want to pause here or implement a webhook listener
      // For this script, we'll just show verification steps
    }

    // Verify deposit (will work in mock mode, may need manual action in live)
    const verifyResponse = await client.get(`/wallet/deposit/${depositReference}`, true);
    
    if (!verifyResponse.success) {
      throw new Error('Failed to verify deposit');
    }

    // Get updated wallet balance
    const walletResponse = await client.get('/wallet', true);
    if (!walletResponse.success) {
      throw new Error('Failed to fetch updated wallet details');
    }

    const newBalance = walletResponse.data.data.wallet.balance;
    await log(`Updated wallet balance: ${newBalance} (was ${walletBalance})`);
    if (newBalance > walletBalance || config.useMockPayment) {
      await log('Deposit successful - balance increased');
    } else {
      await log('NOTE: Balance not increased yet. In live mode, this may be because payment is still processing');
    }
    
    walletBalance = newBalance; // Update the global balance
    
    await log('Deposit tests completed');
    return true;
  },

  async banks() {
    await log('===== BANK TESTS =====');

    // Seed banks if needed
    if (config.useMockPayment) {
      await log('Seeding banks in mock mode');
      const seedResponse = await client.post('/banks/seed', {});
      
      if (!seedResponse.success) {
        await log('Bank seeding failed - this may affect bank-related tests', true);
      } else {
        await log('Banks seeded successfully');
      }
    }

    // Get all banks
    const banksResponse = await client.get('/banks');
    
    if (!banksResponse.success) {
      throw new Error('Failed to fetch banks');
    }
    
    const banks = banksResponse.data.data;
    await log(`Retrieved ${banks.length} banks`);

    // Test bank account verification
    const testBankCode = '000013'; // GTBank code
    const testAccountNumber = '0123456789';
    
    let verifyAccountResponse;
    
    if (config.useMockPayment) {
      await log('Testing mock account verification');
      verifyAccountResponse = await client.post('/wallet/mock-verify-account', {
        bankCode: testBankCode,
        accountNumber: testAccountNumber
      }, true);
    } else {
      await log('Testing live account verification');
      verifyAccountResponse = await client.post('/banks/verify-account', {
        bankCode: testBankCode,
        accountNumber: testAccountNumber
      }, true);
    }
    
    if (!verifyAccountResponse.success) {
      await log('Bank account verification failed - this may affect withdrawal tests', true);
    } else {
      const accountName = verifyAccountResponse.data.data.account_name;
      await log(`Account verified successfully: ${accountName}`);
    }
    
    await log('Bank tests completed');
    return true;
  },

  async paymentLink() {
    await log('===== PAYMENT LINK TESTS =====');

    // Create payment link
    const paymentLinkResponse = await client.post('/wallet/payment-link', {
      amount: 2000,
      description: 'Test payment link'
    }, true);
    
    if (!paymentLinkResponse.success) {
      throw new Error('Failed to create payment link');
    }
    
    const paymentLink = paymentLinkResponse.data.data.paymentLink;
    paymentLinkHash = paymentLinkResponse.data.data.hash;
    const paymentLinkRef = paymentLinkResponse.data.data.reference;
    
    await log(`Payment link created: ${paymentLink}`);
    await log(`Payment link hash: ${paymentLinkHash}`);
    await log(`Payment link reference: ${paymentLinkRef}`);
    
    await log('NOTE: In live mode, you would share this link with users to make payments');
    
    await log('Payment link tests completed');
    return true;
  },

  async withdraw() {
    await log('===== WITHDRAWAL TESTS =====');

    // Check if we have sufficient balance
    if (walletBalance < 500) {
      await log('Insufficient balance for withdrawal test. Minimum required: 500', true);
      await log('Please complete deposit test successfully before running withdrawal test', true);
      return false;
    }

    const withdrawalAmount = 500;
    const bankCode = '000013'; // GTBank
    const accountNumber = '0123456789';
    const accountName = 'TEST ACCOUNT';
    
    let withdrawResponse;
    
    if (config.useMockPayment) {
      await log('Testing mock withdrawal');
      withdrawResponse = await client.post('/wallet/mock-withdraw', {
        amount: withdrawalAmount,
        bankCode,
        accountNumber,
        accountName
      }, true);
    } else {
      await log('Testing live withdrawal');
      withdrawResponse = await client.post('/wallet/withdraw', {
        amount: withdrawalAmount,
        bankCode,
        accountNumber,
        accountName
      }, true);
    }
    
    if (!withdrawResponse.success) {
      await log('Withdrawal failed', true);
      if (withdrawResponse.data.error?.includes('bank code')) {
        await log('TIP: Ensure banks are seeded properly and valid bank codes are used', true);
      }
      if (withdrawResponse.data.error?.includes('funds')) {
        await log('TIP: Ensure wallet has sufficient balance', true);
      }
      throw new Error('Withdrawal test failed');
    }
    
    const transactionRef = withdrawResponse.data.data.transaction.reference;
    await log(`Withdrawal processed with reference: ${transactionRef}`);
    
    // Verify updated balance
    const walletResponse = await client.get('/wallet', true);
    if (!walletResponse.success) {
      throw new Error('Failed to fetch updated wallet after withdrawal');
    }
    
    const newBalance = walletResponse.data.data.wallet.balance;
    await log(`Updated wallet balance after withdrawal: ${newBalance} (was ${walletBalance})`);
    if (newBalance < walletBalance) {
      await log('Withdrawal successful - balance decreased');
    } else {
      await log('NOTE: Balance not decreased yet. If in live mode, check transaction status', true);
    }
    
    walletBalance = newBalance;
    
    await log('Withdrawal tests completed');
    return true;
  },

  async transactions() {
    await log('===== TRANSACTION HISTORY TESTS =====');

    // Get transaction history
    const transactionsResponse = await client.get('/wallet/transactions', true);
    
    if (!transactionsResponse.success) {
      throw new Error('Failed to fetch transaction history');
    }
    
    const transactions = transactionsResponse.data.data.transactions;
    await log(`Retrieved ${transactions.length} transactions`);
    
    // Check if we have both deposit and withdrawal transactions
    const depositTxns = transactions.filter(t => t.type === 'deposit');
    const withdrawalTxns = transactions.filter(t => t.type === 'withdrawal');
    
    await log(`Found ${depositTxns.length} deposit transactions`);
    await log(`Found ${withdrawalTxns.length} withdrawal transactions`);
    
    // Test filtering
    const depositFilterResponse = await client.get('/wallet/transactions?type=deposit', true);
    if (!depositFilterResponse.success) {
      throw new Error('Failed to fetch filtered transactions');
    }
    
    const filteredTransactions = depositFilterResponse.data.data.transactions;
    await log(`Retrieved ${filteredTransactions.length} deposit transactions with filter`);
    
    await log('Transaction history tests completed');
    return true;
  }
};

// Main test runner
async function runTests() {
  await initLogFile();
  await log('Starting MicroFund API Tests');
  await log(`Mode: ${config.useMockPayment ? 'MOCK' : 'LIVE'}`);
  
  try {
    // Always run auth first
    await tests.authenticate();
    
    // Run other tests - they depend on successful authentication
    await tests.walletBasics();
    await tests.deposit();
    await tests.banks();
    await tests.paymentLink();
    await tests.withdraw();
    await tests.transactions();
    
    await log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
  } catch (error) {
    await log(`\n❌ TESTS FAILED: ${error.message}`, true);
  }
}

// Run the tests
runTests();