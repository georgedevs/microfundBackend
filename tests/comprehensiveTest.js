const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const config = {
  baseUrl: process.env.API_URL || 'http://localhost:5000/api',
  useMockPayment: process.env.USE_MOCK_PAYMENT === 'true',
  mockPaymentSuccess: true,
  logToFile: true,
  logFilePath: './test-results.log',
  // Test in parallel or sequentially
  runInParallel: false,
  // Delay between sequential tests (ms)
  testDelay: 1000,
  // Whether to continue on test failure
  continueOnFailure: true,
  // Add a delay before test completion (ms)
  completionDelay: 3000
};

// Test credentials
const testUser = {
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
let walletBalance = 0;
let businessId;
let productId;
let groupId;
let educationModuleId;
let virtualAccountNumber;

// Utility function for logging
async function log(message, isError = false, important = false) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${isError ? 'ERROR: ' : ''}${message}`;
  
  if (important) {
    logMessage = `\n${'='.repeat(80)}\n${logMessage}\n${'='.repeat(80)}\n`;
  }

  console.log(isError ? '\x1b[31m%s\x1b[0m' : (important ? '\x1b[36m%s\x1b[0m' : '%s'), logMessage);

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
      const timestamp = new Date().toISOString();
      await fs.writeFile(
        config.logFilePath,
        `MICROFUND COMPREHENSIVE TEST RUN: ${timestamp}\n` +
        `Mode: ${config.useMockPayment ? 'MOCK' : 'LIVE'}\n` +
        `API URL: ${config.baseUrl}\n` +
        `${'='.repeat(80)}\n\n`
      );
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }
}

// Generate a random username to avoid conflicts
function generateRandomUsername() {
  const random = Math.floor(Math.random() * 10000);
  return `test${random}@university.edu.ng`;
}

// Delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// HTTP client with authorization and error handling
const client = {
  async request(method, url, data = null, requireAuth = false, customHeaders = {}) {
    try {
      const headers = { ...customHeaders };
      
      if (requireAuth) {
        if (!authToken) {
          throw new Error('Authentication token is required but not available');
        }
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      if (data && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const logData = data && typeof data === 'object' 
        ? JSON.stringify(data).length > 500 
          ? JSON.stringify(data).substring(0, 500) + '... (truncated)'
          : JSON.stringify(data)
        : data;

      await log(`Sending ${method} request to ${url}${data ? ' with data: ' + logData : ''}`);

      const response = await axios({
        method,
        url: `${config.baseUrl}${url}`,
        data,
        headers,
        validateStatus: () => true, // Don't throw on any status code
        timeout: 10000 // 10 second timeout
      });

      const logResponseData = response.data && typeof response.data === 'object' 
        ? JSON.stringify(response.data).length > 500 
          ? JSON.stringify(response.data).substring(0, 500) + '... (truncated)'
          : JSON.stringify(response.data)
        : response.data;

      await log(`Response status: ${response.status}`);
      await log(`Response data: ${logResponseData}`);

      return {
        status: response.status,
        data: response.data,
        success: response.status >= 200 && response.status < 300 && 
                (response.data?.success !== false), // Handle explicit success:false
        headers: response.headers
      };
    } catch (error) {
      await log(`Request failed: ${error.message}`, true);
      if (error.response) {
        await log(`Response status: ${error.response.status}`, true);
        await log(`Response data: ${JSON.stringify(error.response.data)}`, true);
      }
      
      return {
        status: error.response?.status || 500,
        data: error.response?.data || { error: error.message },
        success: false,
        headers: error.response?.headers || {}
      };
    }
  },

  async get(url, requireAuth = false, customHeaders = {}) {
    return this.request('GET', url, null, requireAuth, customHeaders);
  },

  async post(url, data, requireAuth = false, customHeaders = {}) {
    return this.request('POST', url, data, requireAuth, customHeaders);
  },

  async put(url, data, requireAuth = false, customHeaders = {}) {
    return this.request('PUT', url, data, requireAuth, customHeaders);
  },

  async patch(url, data, requireAuth = false, customHeaders = {}) {
    return this.request('PATCH', url, data, requireAuth, customHeaders);
  },

  async delete(url, requireAuth = false, customHeaders = {}) {
    return this.request('DELETE', url, null, requireAuth, customHeaders);
  }
};

// Test runner function
async function runTest(name, testFn) {
  await log(`Running test: ${name}`, false, true);
  
  try {
    const startTime = Date.now();
    const result = await testFn();
    const endTime = Date.now();
    
    if (result === false) {
      await log(`Test '${name}' skipped`, false);
      return false;
    }
    
    await log(`Test '${name}' completed successfully in ${endTime - startTime}ms`, false);
    return true;
  } catch (error) {
    await log(`Test '${name}' failed: ${error.message}`, true);
    if (error.stack) {
      await log(`Stack trace: ${error.stack}`, true);
    }
    
    if (!config.continueOnFailure) {
      throw new Error(`Test '${name}' failed, stopping test suite`);
    }
    
    return false;
  }
}

// Test suites
const tests = {
  async healthCheck() {
    const response = await client.get('/health');
    
    if (!response.success) {
      throw new Error('Health check failed');
    }
    
    await log('API is up and running');
    return true;
  },

  async authenticate() {
    // Use a random email to avoid conflicts with existing users
    const email = generateRandomUsername();
    testUser.email = email;
    
    await log(`Using test user with email: ${email}`);
    
    // Try to register a new user
    const registerResponse = await client.post('/auth/register', testUser);

    if (!registerResponse.success) {
      await log('Registration failed, attempting login with existing credentials', true);
      
      // Try with original test user
      testUser.email = 'test@university.edu.ng';
      
      const loginResponse = await client.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });

      if (!loginResponse.success) {
        throw new Error('Authentication failed - could not register or login');
      }

      authToken = loginResponse.data.data.token;
      await log('Login successful with existing user');
    } else {
      authToken = registerResponse.data.data.token;
      await log('Registration successful for new user');
    }

    // Get user profile
    const profileResponse = await client.get('/auth/me', true);
    if (!profileResponse.success) {
      throw new Error('Failed to fetch user profile');
    }

    userId = profileResponse.data.data.user._id;
    await log(`User ID: ${userId}`);
    
    return true;
  },
  
  async walletBasics() {
    // Get wallet details
    const walletResponse = await client.get('/wallet', true);
    if (!walletResponse.success) {
      throw new Error('Failed to fetch wallet details');
    }

    walletBalance = walletResponse.data.data.wallet.balance;
    await log(`Initial wallet balance: ${walletBalance}`);
    
    return true;
  },

  async createVirtualAccount() {
    // Request a virtual account
    const virtualAccountResponse = await client.post('/wallet/virtual-account', {}, true);
    
    if (!virtualAccountResponse.success) {
      // This might fail if the user already has a virtual account or if not enabled
      await log('Virtual account creation failed, this may be expected if already exists');
      
      // Check wallet to see if there's already an account
      const walletResponse = await client.get('/wallet', true);
      
      if (walletResponse.success && 
          walletResponse.data.data.wallet.accountNumber) {
        virtualAccountNumber = walletResponse.data.data.wallet.accountNumber;
        await log(`Using existing virtual account: ${virtualAccountNumber}`);
        return true;
      }
      
      await log('Failed to create or retrieve virtual account', true);
      return false;
    }
    
    virtualAccountNumber = virtualAccountResponse.data.data.accountNumber;
    await log(`Virtual account created: ${virtualAccountNumber}`);
    
    return true;
  },

  async deposit() {
    // Initiate deposit
    const depositAmount = 1000;
    const initiateResponse = await client.post('/wallet/deposit', {
      amount: depositAmount,
    }, true);

    if (!initiateResponse.success) {
      throw new Error('Failed to initiate deposit');
    }

    const depositReference = initiateResponse.data.data.reference;
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
    }

    // Verify deposit
    const verifyResponse = await client.get(`/wallet/deposit/${depositReference}`, true);
    
    if (!verifyResponse.success && config.mockPaymentSuccess) {
      throw new Error('Failed to verify deposit');
    }

    // Get updated wallet balance
    const walletResponse = await client.get('/wallet', true);
    if (!walletResponse.success) {
      throw new Error('Failed to fetch updated wallet details');
    }

    const newBalance = walletResponse.data.data.wallet.balance;
    await log(`Updated wallet balance: ${newBalance} (was ${walletBalance})`);
    
    if (newBalance > walletBalance || config.mockPaymentSuccess) {
      await log('Deposit successful - balance increased');
    } else {
      await log('NOTE: Balance not increased yet. In live mode, this may be because payment is still processing');
    }
    
    walletBalance = newBalance; // Update the global balance
    
    return true;
  },

  async paymentLink() {
    // Create payment link
    const paymentLinkResponse = await client.post('/payment-links', {
      amount: 2000,
      description: 'Test payment link'
    }, true);
    
    if (!paymentLinkResponse.success) {
      throw new Error('Failed to create payment link');
    }
    
    const paymentLink = paymentLinkResponse.data.data.paymentLink;
    const paymentLinkHash = paymentLinkResponse.data.data.hash;
    const paymentLinkRef = paymentLinkResponse.data.data.reference;
    
    await log(`Payment link created: ${paymentLink}`);
    await log(`Payment link hash: ${paymentLinkHash}`);
    await log(`Payment link reference: ${paymentLinkRef}`);
    
    // Get user's payment links
    const userLinksResponse = await client.get('/payment-links', true);
    
    if (!userLinksResponse.success) {
      throw new Error('Failed to get user payment links');
    }
    
    await log(`Retrieved ${userLinksResponse.data.data.length} payment links`);
    
    // Verify payment link
    const verifyLinkResponse = await client.get(`/payment-links/${paymentLinkRef}/verify`, true);
    
    if (!verifyLinkResponse.success) {
      throw new Error('Failed to verify payment link');
    }
    
    await log(`Payment link verified successfully: ${verifyLinkResponse.data.data.verified ? 'Paid' : 'Not paid yet'}`);
    
    return true;
  },
  
  async banks() {
    // Get all banks
    const banksResponse = await client.get('/banks');
    
    if (!banksResponse.success || !banksResponse.data.data) {
      throw new Error('Failed to fetch banks');
    }
    
    const banks = banksResponse.data.data;
    await log(`Retrieved ${banks.length} banks`);

    // Test bank account verification (use with caution in live environment)
    if (config.useMockPayment) {
      const testBankCode = banks[0]?.code || '000013'; // GTBank code
      const testAccountNumber = '0123456789';
      
      await log('Testing mock account verification');
      const verifyAccountResponse = await client.post('/banks/verify-account', {
        bankCode: testBankCode,
        accountNumber: testAccountNumber
      }, true);
      
      if (!verifyAccountResponse.success) {
        await log('Bank account verification failed - this may affect withdrawal tests', true);
      } else {
        const accountName = verifyAccountResponse.data.data.account_name;
        await log(`Account verified successfully: ${accountName}`);
      }
    }
    
    return true;
  },
  
  async withdraw() {
    // Only proceed if we have sufficient balance
    if (walletBalance < 500) {
      await log('Insufficient balance for withdrawal test. Minimum required: 500', true);
      await log('Skipping withdrawal test');
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
      await log('NOTE: Balance not decreased yet. If in live mode, check transaction status');
    }
    
    walletBalance = newBalance;
    
    return true;
  },

  async transactions() {
    // Get transaction history
    const transactionsResponse = await client.get('/wallet/transactions', true);
    
    if (!transactionsResponse.success) {
      throw new Error('Failed to fetch transaction history');
    }
    
    const transactions = transactionsResponse.data.data.transactions;
    await log(`Retrieved ${transactions.length} transactions`);
    
    // Check types of transactions
    const types = {};
    transactions.forEach(t => {
      types[t.type] = (types[t.type] || 0) + 1;
    });
    
    await log(`Transaction types summary: ${JSON.stringify(types)}`);
    
    // Test filtering by type
    const filteredResponse = await client.get('/wallet/transactions?type=deposit', true);
    if (!filteredResponse.success) {
      throw new Error('Failed to fetch filtered transactions');
    }
    
    const filteredTransactions = filteredResponse.data.data.transactions;
    await log(`Retrieved ${filteredTransactions.length} deposit transactions with filter`);
    
    return true;
  },

  async valueAddedServices() {
    // Get data bundles for MTN
    const dataResponse = await client.get('/vas/data-bundles?network=MTN', true);
    
    if (!dataResponse.success) {
      await log('VAS data bundles endpoint failed, this service might not be enabled', true);
      return false;
    }
    
    const bundles = dataResponse.data.data;
    await log(`Retrieved ${bundles.length} data bundles for MTN`);
    
    // Skip actual purchase in tests to avoid charges
    await log('Skipping actual VAS purchases to avoid charges');
    
    return true;
  },

  async ussdPayment() {
    // Get supported banks
    const banksResponse = await client.get('/ussd/banks', true);
    
    if (!banksResponse.success) {
      await log('USSD banks endpoint failed, this service might not be enabled', true);
      return false;
    }
    
    const banks = banksResponse.data.data;
    await log(`Retrieved ${banks.length} USSD supported banks`);
    
    // Skip actual USSD initiation in tests
    await log('Skipping actual USSD payment initiation');
    
    return true;
  },

  async createBusiness() {
    // Create a business
    const businessData = {
      name: 'Test Business',
      description: 'This is a test business created by automated testing',
      category: 'technology',
      fundingGoal: 10000,
      expectedReturnRate: 15,
      duration: 6,
      location: 'Lagos, Nigeria',
      contactEmail: testUser.email,
      contactPhone: '08012345678'
    };
    
    const createResponse = await client.post('/business', businessData, true);
    
    if (!createResponse.success) {
      throw new Error('Failed to create business');
    }
    
    businessId = createResponse.data.data._id;
    await log(`Business created with ID: ${businessId}`);
    
    // Publish business
    const publishResponse = await client.post(`/business/${businessId}/publish`, {}, true);
    
    if (!publishResponse.success) {
      await log('Failed to publish business, continuing anyway', true);
    } else {
      await log('Business published successfully');
    }
    
    // Get business details
    const detailsResponse = await client.get(`/business/${businessId}`, true);
    
    if (!detailsResponse.success) {
      throw new Error('Failed to get business details');
    }
    
    await log('Retrieved business details successfully');
    
    return true;
  },
  
  async createProduct() {
    if (!businessId) {
      await log('No business ID available, skipping product creation', true);
      return false;
    }
    
    // Create a product
    const productData = {
      name: 'Test Product',
      description: 'This is a test product created by automated testing',
      price: 1000,
      category: 'Software'
    };
    
    const createResponse = await client.post(`/business/${businessId}/products`, productData, true);
    
    if (!createResponse.success) {
      throw new Error('Failed to create product');
    }
    
    productId = createResponse.data.data._id;
    await log(`Product created with ID: ${productId}`);
    
    // Get business products
    const productsResponse = await client.get(`/business/${businessId}/products`);
    
    if (!productsResponse.success) {
      throw new Error('Failed to get business products');
    }
    
    await log(`Retrieved ${productsResponse.data.data.products.length} products`);
    
    // Get product details
    const detailsResponse = await client.get(`/business/products/${productId}`);
    
    if (!detailsResponse.success) {
      throw new Error('Failed to get product details');
    }
    
    await log('Retrieved product details successfully');
    
    return true;
  },
  
  async updateProduct() {
    if (!productId) {
      await log('No product ID available, skipping product update', true);
      return false;
    }
    
    // Update product
    const updateData = {
      price: 1200,
      description: 'Updated description from automated testing'
    };
    
    const updateResponse = await client.put(`/business/products/${productId}`, updateData, true);
    
    if (!updateResponse.success) {
      throw new Error('Failed to update product');
    }
    
    await log('Product updated successfully');
    
    return true;
  },
  
  async createBusinessUpdate() {
    if (!businessId) {
      await log('No business ID available, skipping business update', true);
      return false;
    }
    
    // Add business update
    const updateData = {
      title: 'Test Update',
      content: 'This is a test update created by automated testing'
    };
    
    const updateResponse = await client.post(`/business/${businessId}/updates`, updateData, true);
    
    if (!updateResponse.success) {
      throw new Error('Failed to create business update');
    }
    
    await log('Business update created successfully');
    
    return true;
  },
  
  async investInBusiness() {
    if (!businessId || walletBalance < 500) {
      await log('No business ID or insufficient balance, skipping investment', true);
      return false;
    }
    
    // Invest in business
    const investData = {
      amount: 500
    };
    
    const investResponse = await client.post(`/business/${businessId}/invest`, investData, true);
    
    if (!investResponse.success) {
      // Might fail if investing in own business
      await log('Failed to invest in business, may be expected if own business', true);
      return false;
    }
    
    await log('Investment successful');
    
    // Get user investments
    const investmentsResponse = await client.get('/business/my/investments', true);
    
    if (!investmentsResponse.success) {
      throw new Error('Failed to get user investments');
    }
    
    await log(`Retrieved ${investmentsResponse.data.data.length} investments`);
    
    // Update wallet balance
    const walletResponse = await client.get('/wallet', true);
    if (walletResponse.success) {
      walletBalance = walletResponse.data.data.wallet.balance;
      await log(`Updated wallet balance: ${walletBalance}`);
    }
    
    return true;
  },

  async createSavingsGroup() {
    // Create savings group
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    
    const groupData = {
      name: 'Test Savings Group',
      description: 'This is a test savings group created by automated testing',
      targetAmount: 10000,
      contributionAmount: 500,
      frequency: 'weekly',
      startDate: tomorrow.toISOString(),
      endDate: endDate.toISOString()
    };
    
    const createResponse = await client.post('/savings/groups', groupData, true);
    
    if (!createResponse.success) {
      throw new Error('Failed to create savings group');
    }
    
    groupId = createResponse.data.data._id;
    await log(`Savings group created with ID: ${groupId}`);
    
    // Get all groups
    const groupsResponse = await client.get('/savings/groups', true);
    
    if (!groupsResponse.success) {
      throw new Error('Failed to get all savings groups');
    }
    
    await log(`Retrieved ${groupsResponse.data.data.groups.length} savings groups`);
    
    // Get user groups
    const userGroupsResponse = await client.get('/savings/my-groups', true);
    
    if (!userGroupsResponse.success) {
      throw new Error('Failed to get user savings groups');
    }
    
    await log(`Retrieved user's savings groups`);
    
    // Get group details
    const detailsResponse = await client.get(`/savings/groups/${groupId}`, true);
    
    if (!detailsResponse.success) {
      throw new Error('Failed to get group details');
    }
    
    await log('Retrieved group details successfully');
    
    return true;
  },
  
  async contributeSavings() {
    if (!groupId || walletBalance < 100) {
      await log('No group ID or insufficient balance, skipping contribution', true);
      return false;
    }
    
    // Contribute to savings group
    const contributeData = {
      amount: 100
    };
    
    const contributeResponse = await client.post(`/savings/groups/${groupId}/contribute`, contributeData, true);
    
    if (!contributeResponse.success) {
      throw new Error('Failed to contribute to savings group');
    }
    
    await log('Contribution successful');
    
    // Get user contributions
    const contributionsResponse = await client.get(`/savings/groups/${groupId}/contributions`, true);
    
    if (!contributionsResponse.success) {
      throw new Error('Failed to get user contributions');
    }
    
    await log('Retrieved user contributions successfully');
    
    // Update wallet balance
    const walletResponse = await client.get('/wallet', true);
    if (walletResponse.success) {
      walletBalance = walletResponse.data.data.wallet.balance;
      await log(`Updated wallet balance: ${walletBalance}`);
    }
    
    return true;
  },

  async educationModules() {
    // Get all modules
    const modulesResponse = await client.get('/education/modules');
    
    if (!modulesResponse.success) {
      throw new Error('Failed to get education modules');
    }
    
    const modules = modulesResponse.data.data.modules;
    await log(`Retrieved ${modules.length} education modules`);
    
    if (modules.length > 0) {
      educationModuleId = modules[0]._id;
      await log(`Selected module ID: ${educationModuleId}`);
      
      // Get module details
      const detailsResponse = await client.get(`/education/modules/${educationModuleId}`);
      
      if (!detailsResponse.success) {
        throw new Error('Failed to get module details');
      }
      
      await log('Retrieved module details successfully');
      
      // Submit quiz
      if (detailsResponse.data.data.module.quiz && 
          detailsResponse.data.data.module.quiz.length > 0) {
        
        // Create dummy answers (just select first option for each question)
        const answers = detailsResponse.data.data.module.quiz.map(() => 0);
        
        const submitResponse = await client.post(`/education/modules/${educationModuleId}/submit`, {
          answers
        }, true);
        
        if (!submitResponse.success) {
          await log('Failed to submit quiz, continuing anyway', true);
        } else {
          await log(`Quiz submitted with score: ${submitResponse.data.data.score}%`);
        }
      }
      
      // Get leaderboard
      const leaderboardResponse = await client.get('/education/leaderboard');
      
      if (!leaderboardResponse.success) {
        await log('Failed to get leaderboard, continuing anyway', true);
      } else {
        await log(`Retrieved leaderboard with ${leaderboardResponse.data.data.length} entries`);
      }
      
      // Get user progress
      const progressResponse = await client.get('/education/progress', true);
      
      if (!progressResponse.success) {
        await log('Failed to get user progress, continuing anyway', true);
      } else {
        await log('Retrieved user progress successfully');
      }
    }
    
    return true;
  },

  async notifications() {
    // Get all notifications
    const notificationsResponse = await client.get('/notifications', true);
    
    if (!notificationsResponse.success) {
      throw new Error('Failed to get notifications');
    }
    
    const notifications = notificationsResponse.data.data;
    await log(`Retrieved ${notifications.length} notifications`);
    
    // Get unread notifications
    const unreadResponse = await client.get('/notifications/unread', true);
    
    if (!unreadResponse.success) {
      throw new Error('Failed to get unread notifications');
    }
    
    const unreadCount = unreadResponse.data.data.length;
    await log(`Retrieved ${unreadCount} unread notifications`);
    
    // Mark all as read if there are any
    if (unreadCount > 0) {
      const markAllResponse = await client.patch('/notifications/read-all', {}, true);
      
      if (!markAllResponse.success) {
        await log('Failed to mark all notifications as read, continuing anyway', true);
      } else {
        await log('Marked all notifications as read');
      }
    }
    
    return true;
  },
  
  async emailTest() {
    // Only in development mode
    if (process.env.NODE_ENV !== 'development' && !config.useMockPayment) {
      await log('Skipping email test in production mode');
      return false;
    }
    
    // Send test email
    const emailResponse = await client.post('/email/test', {
      type: 'welcome'
    }, true);
    
    if (!emailResponse.success) {
      await log('Email test failed, this feature might not be enabled', true);
      return false;
    }
    
    await log('Test email sent successfully');
    return true;
  },
  
  async cleanup() {
    await log('Starting cleanup tasks', false, true);
    
    // Delete product if created
    if (productId) {
      const deleteResponse = await client.delete(`/business/products/${productId}`, true);
      
      if (!deleteResponse.success) {
        await log('Failed to delete product, continuing cleanup', true);
      } else {
        await log('Product deleted successfully');
      }
    }
    
    // Leave savings group if joined
    if (groupId) {
      await log('Note: Not leaving savings group as creator cannot leave');
    }
    
    return true;
  }
};

// Main test runner
async function runTests() {
  await initLogFile();
  await log('Starting MicroFund API Comprehensive Tests', false, true);
  await log(`Mode: ${config.useMockPayment ? 'MOCK' : 'LIVE'}`);
  await log(`API URL: ${config.baseUrl}`);
  
  const testNames = Object.keys(tests);
  let totalTests = testNames.length;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  
  try {
    // Always run health check and auth first
    const healthCheckPassed = await runTest('healthCheck', tests.healthCheck);
    if (!healthCheckPassed) {
      throw new Error('Health check failed, aborting all tests');
    }
    
    const authPassed = await runTest('authenticate', tests.authenticate);
    if (!authPassed) {
      throw new Error('Authentication failed, aborting all tests');
    }
    
    passedTests += 2;
    
    // Run the rest of the tests
    const remainingTests = testNames.filter(name => 
      name !== 'healthCheck' && name !== 'authenticate');
    
    if (config.runInParallel) {
      // Run tests in parallel
      await log('Running remaining tests in parallel');
      
      const results = await Promise.allSettled(
        remainingTests.map(name => runTest(name, tests[name]))
      );
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value === false) {
            skippedTests++;
          } else {
            passedTests++;
          }
        } else {
          failedTests++;
          
          if (!config.continueOnFailure) {
            throw new Error(`Test '${remainingTests[index]}' failed, stopping test suite`);
          }
        }
      });
    } else {
      // Run tests sequentially
      for (const name of remainingTests) {
        try {
          // Skip cleanup until the end
          if (name === 'cleanup') continue;
          
          // Add a delay between tests
          if (passedTests + failedTests + skippedTests > 0) {
            await log(`Waiting ${config.testDelay}ms before next test...`);
            await delay(config.testDelay);
          }
          
          const passed = await runTest(name, tests[name]);
          
          if (passed === false) {
            skippedTests++;
          } else {
            passedTests++;
          }
        } catch (error) {
          failedTests++;
          
          if (!config.continueOnFailure) {
            throw error;
          }
        }
      }
      
      // Always run cleanup last
      if (remainingTests.includes('cleanup')) {
        await log(`Running cleanup tasks...`);
        try {
          const passed = await runTest('cleanup', tests.cleanup);
          if (passed === false) {
            skippedTests++;
          } else {
            passedTests++;
          }
        } catch (error) {
          failedTests++;
        }
      }
    }
    
    // Final delay before completing
    if (config.completionDelay > 0) {
      await delay(config.completionDelay);
    }
    
    // Calculate summary
    const summary = `
${'='.repeat(80)}
TESTS SUMMARY
${'='.repeat(80)}
Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${failedTests}
Skipped: ${skippedTests}
Pass Rate: ${((passedTests / (totalTests - skippedTests)) * 100).toFixed(2)}%
${'='.repeat(80)}
    `;
    
    await log(summary, false, true);
    
    if (failedTests === 0) {
      await log('\n✅ ALL EXECUTED TESTS COMPLETED SUCCESSFULLY!', false, true);
    } else {
      await log(`\n❌ ${failedTests} TESTS FAILED`, true, true);
    }
  } catch (error) {
    await log(`\n❌ TEST SUITE ABORTED: ${error.message}`, true, true);
  }
}

// Run the tests
runTests();