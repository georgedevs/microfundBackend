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
exports.walletService = exports.WalletService = void 0;
const User_1 = __importDefault(require("@/models/User"));
const Wallet_1 = __importDefault(require("@/models/Wallet"));
const Transaction_1 = __importDefault(require("@/models/Transaction"));
const payment_1 = require("@/services/payment");
const bank_service_1 = require("@/services/bank.service");
const error_1 = __importDefault(require("@/utils/error"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
class WalletService {
    /**
     * Get or create a wallet for a user
     */
    getOrCreateWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let wallet = yield Wallet_1.default.findOne({ userId });
            if (!wallet) {
                wallet = yield Wallet_1.default.create({
                    userId,
                    balance: 0,
                });
            }
            return wallet;
        });
    }
    /**
     * Initiate a deposit to user's wallet
     */
    initiateDeposit(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount < 100) {
                throw new error_1.default('Minimum deposit amount is ₦100', 400);
            }
            const user = yield User_1.default.findById(userId);
            if (!user) {
                throw new error_1.default('User not found', 404);
            }
            // Generate unique reference
            const reference = `MF-DEP-${Date.now()}-${userId.substring(0, 5)}`;
            // Initialize payment with payment service
            const result = yield payment_1.paymentService.initializeTransaction(amount, user.email, reference, user.fullName, {
                userId,
                transactionType: 'deposit'
            });
            // Create transaction record
            yield Transaction_1.default.create({
                userId,
                type: 'deposit',
                amount,
                status: 'pending',
                reference,
                description: 'Wallet deposit',
                metadata: {
                    checkoutUrl: result.checkoutUrl
                }
            });
            return {
                reference,
                checkoutUrl: result.checkoutUrl
            };
        });
    }
    /**
     * Verify and process a deposit
     */
    verifyDeposit(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find transaction record
            const transaction = yield Transaction_1.default.findOne({ reference });
            if (!transaction) {
                throw new error_1.default('Transaction not found', 404);
            }
            if (transaction.status === 'completed') {
                return { success: true, transaction };
            }
            // Verify with payment service
            const result = yield payment_1.paymentService.verifyTransaction(reference);
            if (!result.success) {
                // If verification failed, update transaction status
                transaction.status = 'failed';
                yield transaction.save();
                return { success: false, transaction };
            }
            const verificationData = result.data;
            console.log("Verification Data:", verificationData);
            // Check if payment was successful
            if (verificationData.transaction_status.toLowerCase() === 'success') {
                const session = yield mongoose_1.default.startSession();
                session.startTransaction();
                try {
                    // Update transaction status
                    transaction.status = 'completed';
                    yield transaction.save({ session });
                    // Update user wallet balance
                    const wallet = yield Wallet_1.default.findOne({ userId: transaction.userId });
                    if (!wallet) {
                        throw new error_1.default('Wallet not found', 404);
                    }
                    wallet.balance += transaction.amount;
                    yield wallet.save({ session });
                    // Also update user model balance for convenience
                    const user = yield User_1.default.findById(transaction.userId);
                    if (!user) {
                        throw new error_1.default('User not found', 404);
                    }
                    user.walletBalance += transaction.amount;
                    yield user.save({ session });
                    yield session.commitTransaction();
                    return { success: true, transaction, merchant_info: verificationData.merchant_info };
                }
                catch (error) {
                    yield session.abortTransaction();
                    throw error;
                }
                finally {
                    session.endSession();
                }
            }
            else {
                // Payment was not successful
                transaction.status = 'failed';
                yield transaction.save();
                return { success: false, transaction };
            }
        });
    }
    /**
     * Get wallet details and recent transactions
     */
    getWalletDetails(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = yield this.getOrCreateWallet(userId);
            // Get recent transactions
            const recentTransactions = yield Transaction_1.default.find({ userId })
                .sort({ createdAt: -1 })
                .limit(5);
            return {
                wallet,
                recentTransactions
            };
        });
    }
    /**
     * Get transaction history for a user
     */
    getTransactionHistory(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, query = {}) {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const skip = (page - 1) * limit;
            const filter = { userId };
            // Add filters for transaction type if provided
            if (query.type) {
                filter.type = query.type;
            }
            // Add filters for status if provided
            if (query.status) {
                filter.status = query.status;
            }
            // Date range filters
            if (query.startDate && query.endDate) {
                filter.createdAt = {
                    $gte: new Date(query.startDate),
                    $lte: new Date(query.endDate)
                };
            }
            else if (query.startDate) {
                filter.createdAt = { $gte: new Date(query.startDate) };
            }
            else if (query.endDate) {
                filter.createdAt = { $lte: new Date(query.endDate) };
            }
            const transactions = yield Transaction_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = yield Transaction_1.default.countDocuments(filter);
            return {
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        });
    }
    /**
     * Transfer funds between wallets (internal)
     */
    transferFunds(fromUserId_1, toUserId_1, amount_1, description_1) {
        return __awaiter(this, arguments, void 0, function* (fromUserId, toUserId, amount, description, transactionType = 'transfer') {
            if (amount < 50) {
                throw new error_1.default('Minimum transfer amount is ₦50', 400);
            }
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                // Check sender wallet
                const senderWallet = yield Wallet_1.default.findOne({ userId: fromUserId });
                if (!senderWallet) {
                    throw new error_1.default('Sender wallet not found', 404);
                }
                // Verify sufficient balance
                if (senderWallet.balance < amount) {
                    throw new error_1.default('Insufficient funds', 400);
                }
                // Get or create recipient wallet
                const recipientWallet = yield this.getOrCreateWallet(toUserId);
                // Generate reference
                const reference = `MF-TRF-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
                // Deduct from sender
                senderWallet.balance -= amount;
                yield senderWallet.save({ session });
                // Update sender's user model balance
                const sender = yield User_1.default.findById(fromUserId);
                if (sender) {
                    sender.walletBalance -= amount;
                    yield sender.save({ session });
                }
                // Add to recipient
                recipientWallet.balance += amount;
                yield recipientWallet.save({ session });
                // Update recipient's user model balance
                const recipient = yield User_1.default.findById(toUserId);
                if (recipient) {
                    recipient.walletBalance += amount;
                    yield recipient.save({ session });
                }
                // Create sender transaction record
                yield Transaction_1.default.create([{
                        userId: fromUserId,
                        type: transactionType,
                        amount,
                        status: 'completed',
                        reference: `${reference}-OUT`,
                        description: `${description} (Sent)`,
                        metadata: {
                            recipientId: toUserId
                        }
                    }], { session });
                // Create recipient transaction record
                yield Transaction_1.default.create([{
                        userId: toUserId,
                        type: transactionType,
                        amount,
                        status: 'completed',
                        reference: `${reference}-IN`,
                        description: `${description} (Received)`,
                        metadata: {
                            senderId: fromUserId
                        }
                    }], { session });
                yield session.commitTransaction();
                return {
                    success: true,
                    reference,
                    amount,
                    sender: {
                        userId: fromUserId,
                        newBalance: senderWallet.balance
                    },
                    recipient: {
                        userId: toUserId,
                        newBalance: recipientWallet.balance
                    }
                };
            }
            catch (error) {
                yield session.abortTransaction();
                throw error;
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Withdraw funds to bank account
     */
    withdrawToBank(userId, amount, bankCode, accountNumber, accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount < 500) {
                throw new error_1.default('Minimum withdrawal amount is ₦500', 400);
            }
            // Verify account before proceeding
            yield bank_service_1.bankService.verifyBankAccount(bankCode, accountNumber);
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                // Check user wallet
                const wallet = yield Wallet_1.default.findOne({ userId });
                if (!wallet) {
                    throw new error_1.default('Wallet not found', 404);
                }
                // Verify sufficient balance
                if (wallet.balance < amount) {
                    throw new error_1.default('Insufficient funds', 400);
                }
                // Generate reference
                const reference = `MF-WDR-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
                // Create transaction record (pending status initially)
                const transaction = yield Transaction_1.default.create([{
                        userId,
                        type: 'withdrawal',
                        amount,
                        status: 'pending',
                        reference,
                        description: `Withdrawal to ${accountName} (${accountNumber})`,
                        metadata: {
                            bankCode,
                            accountNumber,
                            accountName
                        }
                    }], { session });
                // Deduct from wallet
                wallet.balance -= amount;
                yield wallet.save({ session });
                // Update user model balance
                const user = yield User_1.default.findById(userId);
                if (user) {
                    user.walletBalance -= amount;
                    yield user.save({ session });
                }
                yield session.commitTransaction();
                // Process transfer (outside transaction since it's an external API call)
                try {
                    const result = yield payment_1.paymentService.transferFunds(reference, amount, bankCode, accountNumber, accountName, `MicroFund withdrawal for ${(user === null || user === void 0 ? void 0 : user.email) || userId}`);
                    if (result.success) {
                        // Update transaction to completed
                        yield Transaction_1.default.findOneAndUpdate({ reference }, {
                            status: 'completed',
                            metadata: Object.assign(Object.assign({}, transaction[0].metadata), { transferReference: result.data.nip_transaction_reference })
                        });
                        return {
                            success: true,
                            transaction: Object.assign(Object.assign({}, transaction[0].toObject()), { status: 'completed' }),
                            transferDetails: result.data
                        };
                    }
                    else {
                        // Handle failed transfer
                        // In a real implementation, you might need a background job to retry or manual intervention
                        yield this.reverseWithdrawal(userId, amount, reference);
                        throw new error_1.default('Fund transfer failed', 500);
                    }
                }
                catch (error) {
                    // Reverse the withdrawal if transfer fails
                    yield this.reverseWithdrawal(userId, amount, reference);
                    throw error;
                }
            }
            catch (error) {
                yield session.abortTransaction();
                throw error;
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Reverse a withdrawal (private helper method)
     */
    reverseWithdrawal(userId, amount, reference) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Update transaction status
                yield Transaction_1.default.findOneAndUpdate({ reference }, { status: 'failed' });
                // Refund the wallet
                const session = yield mongoose_1.default.startSession();
                session.startTransaction();
                try {
                    const wallet = yield Wallet_1.default.findOne({ userId });
                    if (wallet) {
                        wallet.balance += amount;
                        yield wallet.save({ session });
                    }
                    const user = yield User_1.default.findById(userId);
                    if (user) {
                        user.walletBalance += amount;
                        yield user.save({ session });
                    }
                    // Create refund transaction record
                    yield Transaction_1.default.create([{
                            userId,
                            type: 'refund',
                            amount,
                            status: 'completed',
                            reference: `${reference}-REFUND`,
                            description: `Refund for failed withdrawal (${reference})`,
                            metadata: {
                                originalReference: reference
                            }
                        }], { session });
                    yield session.commitTransaction();
                }
                catch (error) {
                    yield session.abortTransaction();
                    throw error;
                }
                finally {
                    session.endSession();
                }
            }
            catch (error) {
                console.error('Error reversing withdrawal:', error);
                // In production, this would trigger an alert for manual intervention
            }
        });
    }
    /**
     * Create payment link for funding
     */
    createPaymentLink(userId, amount, description) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findById(userId);
            if (!user) {
                throw new error_1.default('User not found', 404);
            }
            if (amount < 100) {
                throw new error_1.default('Minimum amount is ₦100', 400);
            }
            // Generate unique hash for payment link
            const hash = `mf-${userId.substring(0, 8)}-${Date.now()}`;
            // Create payment link
            const result = yield payment_1.paymentService.createPaymentLink(`${user.fullName}'s MicroFund Deposit`, hash, amount, description || `Deposit to ${user.fullName}'s MicroFund wallet`);
            if (!result.success) {
                throw new error_1.default('Failed to create payment link', 500);
            }
            // Create transaction record
            const reference = `MF-LNK-${Date.now()}-${userId.substring(0, 5)}`;
            yield Transaction_1.default.create({
                userId,
                type: 'deposit',
                amount,
                status: 'pending',
                reference,
                description: `Payment link deposit: ${description || 'Wallet funding'}`,
                metadata: {
                    paymentLinkHash: hash,
                    paymentLinkUrl: result.paymentUrl || `https://sandbox-pay.squadco.com/${hash}`
                }
            });
            return {
                success: true,
                reference,
                paymentLink: result.paymentUrl || `https://sandbox-pay.squadco.com/${hash}`,
                hash,
                amount,
                description
            };
        });
    }
}
exports.WalletService = WalletService;
// Export as singleton
exports.walletService = new WalletService();
