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
exports.businessService = exports.BusinessService = void 0;
const Business_1 = __importDefault(require("@/models/Business"));
const BusinessUpdate_1 = __importDefault(require("@/models/BusinessUpdate"));
const Investment_1 = __importDefault(require("@/models/Investment"));
const User_1 = __importDefault(require("@/models/User"));
const Transaction_1 = __importDefault(require("@/models/Transaction"));
const wallet_service_1 = require("@/services/wallet.service");
const error_1 = __importDefault(require("@/utils/error"));
const mongoose_1 = __importDefault(require("mongoose"));
class BusinessService {
    /**
     * Create a new business profile
     */
    createBusiness(userId, businessData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate business data
            if (!businessData.name || !businessData.description || !businessData.category) {
                throw new error_1.default('Please provide all required business details', 400);
            }
            if (businessData.fundingGoal <= 0) {
                throw new error_1.default('Funding goal must be greater than 0', 400);
            }
            if (businessData.expectedReturnRate < 0 || businessData.expectedReturnRate > 100) {
                throw new error_1.default('Expected return rate must be between 0 and 100', 400);
            }
            if (businessData.duration < 1) {
                throw new error_1.default('Duration must be at least 1 month', 400);
            }
            // Check if user already has a business with the same name
            const existingBusiness = yield Business_1.default.findOne({
                owner: userId,
                name: businessData.name
            });
            if (existingBusiness) {
                throw new error_1.default('You already have a business with this name', 400);
            }
            // Create business profile
            const business = yield Business_1.default.create(Object.assign(Object.assign({ owner: userId }, businessData), { status: 'draft' }));
            return business;
        });
    }
    /**
     * Get all businesses with filtering and pagination
     */
    getAllBusinesses() {
        return __awaiter(this, arguments, void 0, function* (query = {}) {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const skip = (page - 1) * limit;
            // Build filter
            const filter = { status: 'active' };
            // Search by name or description
            if (query.search) {
                filter.$or = [
                    { name: { $regex: query.search, $options: 'i' } },
                    { description: { $regex: query.search, $options: 'i' } },
                ];
            }
            // Filter by category
            if (query.category) {
                filter.category = query.category;
            }
            // Filter by funding range
            if (query.minFunding) {
                filter.fundingGoal = Object.assign(Object.assign({}, filter.fundingGoal), { $gte: Number(query.minFunding) });
            }
            if (query.maxFunding) {
                filter.fundingGoal = Object.assign(Object.assign({}, filter.fundingGoal), { $lte: Number(query.maxFunding) });
            }
            // Filter by return rate
            if (query.minReturn) {
                filter.expectedReturnRate = Object.assign(Object.assign({}, filter.expectedReturnRate), { $gte: Number(query.minReturn) });
            }
            if (query.maxReturn) {
                filter.expectedReturnRate = Object.assign(Object.assign({}, filter.expectedReturnRate), { $lte: Number(query.maxReturn) });
            }
            // Get businesses with funding progress
            const businesses = yield Business_1.default.find(filter)
                .populate('owner', 'fullName email institution department level profileImage')
                .sort(query.sort || '-createdAt')
                .skip(skip)
                .limit(limit);
            // Get total count
            const total = yield Business_1.default.countDocuments(filter);
            return {
                businesses,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    /**
     * Get businesses owned by a user
     */
    getUserBusinesses(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const businesses = yield Business_1.default.find({ owner: userId })
                .sort('-createdAt');
            return businesses;
        });
    }
    /**
     * Get business details with updates and investors
     */
    getBusinessDetails(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const business = yield Business_1.default.findById(businessId)
                .populate('owner', 'fullName email institution department level profileImage');
            if (!business) {
                throw new error_1.default('Business not found', 404);
            }
            // Get business updates
            const updates = yield BusinessUpdate_1.default.find({ businessId })
                .sort('-createdAt');
            // Get investor count and total investments
            const investments = yield Investment_1.default.find({ business: businessId });
            const investorCount = new Set(investments.map(inv => inv.investor.toString())).size;
            const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
            return {
                business,
                updates,
                statistics: {
                    investorCount,
                    totalInvested,
                    fundingPercentage: (business.raisedAmount / business.fundingGoal) * 100,
                },
            };
        });
    }
    /**
     * Update business profile
     */
    updateBusiness(userId, businessId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const business = yield Business_1.default.findById(businessId);
            if (!business) {
                throw new error_1.default('Business not found', 404);
            }
            // Check if user is the owner
            if (business.owner.toString() !== userId) {
                throw new error_1.default('You are not authorized to update this business', 403);
            }
            // Don't allow updating certain fields
            const protectedFields = ['owner', 'raisedAmount', 'status', 'verificationStatus'];
            protectedFields.forEach(field => {
                if (updateData[field]) {
                    delete updateData[field];
                }
            });
            // Update business
            const updatedBusiness = yield Business_1.default.findByIdAndUpdate(businessId, updateData, { new: true, runValidators: true });
            return updatedBusiness;
        });
    }
    /**
     * Publish business profile (change status from draft to active)
     */
    publishBusiness(userId, businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const business = yield Business_1.default.findById(businessId);
            if (!business) {
                throw new error_1.default('Business not found', 404);
            }
            // Check if user is the owner
            if (business.owner.toString() !== userId) {
                throw new error_1.default('You are not authorized to publish this business', 403);
            }
            // Check if business is in draft status
            if (business.status !== 'draft') {
                throw new error_1.default('Business is already published', 400);
            }
            // Update status to active
            business.status = 'active';
            yield business.save();
            return business;
        });
    }
    /**
     * Add business update
     */
    addBusinessUpdate(userId, businessId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const business = yield Business_1.default.findById(businessId);
            if (!business) {
                throw new error_1.default('Business not found', 404);
            }
            // Check if user is the owner
            if (business.owner.toString() !== userId) {
                throw new error_1.default('You are not authorized to add updates to this business', 403);
            }
            // Create update
            const update = yield BusinessUpdate_1.default.create(Object.assign({ businessId }, updateData));
            return update;
        });
    }
    /**
     * Invest in a business
     */
    investInBusiness(userId, businessId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new error_1.default('Investment amount must be greater than 0', 400);
            }
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                // Get business
                const business = yield Business_1.default.findById(businessId).session(session);
                if (!business) {
                    throw new error_1.default('Business not found', 404);
                }
                // Check if business is active
                if (business.status !== 'active') {
                    throw new error_1.default('This business is not accepting investments at this time', 400);
                }
                // Check if user is the owner
                if (business.owner.toString() === userId) {
                    throw new error_1.default('You cannot invest in your own business', 400);
                }
                // Calculate expected return
                const expectedReturn = amount + (amount * business.expectedReturnRate / 100);
                // Calculate maturity date
                const maturityDate = new Date();
                maturityDate.setMonth(maturityDate.getMonth() + business.duration);
                // Check if user has sufficient balance
                const wallet = yield wallet_service_1.walletService.getOrCreateWallet(userId);
                if (wallet.balance < amount) {
                    throw new error_1.default('Insufficient funds in your wallet', 400);
                }
                // Create unique reference
                const reference = `MF-INV-${Date.now()}-${userId.substring(0, 5)}`;
                // Create investment record
                const investment = yield Investment_1.default.create([{
                        investor: userId,
                        business: businessId,
                        amount,
                        expectedReturn,
                        investmentDate: new Date(),
                        maturityDate,
                        status: 'active',
                        returnsReceived: 0,
                    }], { session });
                // Update business raised amount
                business.raisedAmount += amount;
                // If funding goal is reached, update status
                if (business.raisedAmount >= business.fundingGoal) {
                    business.status = 'funded';
                }
                yield business.save({ session });
                // Deduct from investor's wallet
                wallet.balance -= amount;
                yield wallet.save({ session });
                // Update user model balance
                const investor = yield User_1.default.findById(userId);
                if (investor) {
                    investor.walletBalance -= amount;
                    yield investor.save({ session });
                }
                // Create transaction record
                yield Transaction_1.default.create([{
                        userId,
                        type: 'investment',
                        amount,
                        status: 'completed',
                        reference,
                        description: `Investment in ${business.name}`,
                        metadata: {
                            businessId,
                            investmentId: investment[0]._id,
                        },
                    }], { session });
                // Add funds to business owner's wallet
                const ownerWallet = yield wallet_service_1.walletService.getOrCreateWallet(business.owner.toString());
                ownerWallet.balance += amount;
                yield ownerWallet.save({ session });
                // Update owner's user model balance
                const owner = yield User_1.default.findById(business.owner);
                if (owner) {
                    owner.walletBalance += amount;
                    yield owner.save({ session });
                }
                // Create transaction record for business owner
                yield Transaction_1.default.create([{
                        userId: business.owner,
                        type: 'investment',
                        amount,
                        status: 'completed',
                        reference: `${reference}-RECEIVED`,
                        description: `Investment received for ${business.name}`,
                        metadata: {
                            businessId,
                            investmentId: investment[0]._id,
                            investorId: userId,
                        },
                    }], { session });
                yield session.commitTransaction();
                return {
                    investment: investment[0],
                    business,
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
     * Get user's investments
     */
    getUserInvestments(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const investments = yield Investment_1.default.find({ investor: userId })
                .populate({
                path: 'business',
                select: 'name description category fundingGoal raisedAmount expectedReturnRate duration status',
                populate: {
                    path: 'owner',
                    select: 'fullName email',
                },
            })
                .sort('-investmentDate');
            return investments;
        });
    }
    /**
     * Make a repayment to investors
     */
    makeRepayment(userId, businessId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                // Get business
                const business = yield Business_1.default.findById(businessId).session(session);
                if (!business) {
                    throw new error_1.default('Business not found', 404);
                }
                // Check if user is the owner
                if (business.owner.toString() !== userId) {
                    throw new error_1.default('You are not authorized to make repayments for this business', 403);
                }
                // Get owner's wallet
                const ownerWallet = yield wallet_service_1.walletService.getOrCreateWallet(userId);
                // Check if owner has sufficient balance
                if (ownerWallet.balance < amount) {
                    throw new error_1.default('Insufficient funds in your wallet', 400);
                }
                // Get active investments for this business
                const investments = yield Investment_1.default.find({
                    business: businessId,
                    status: 'active',
                }).session(session);
                if (investments.length === 0) {
                    throw new error_1.default('No active investments found for this business', 400);
                }
                // Calculate total invested amount for distribution ratio
                const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
                // Deduct from owner's wallet
                ownerWallet.balance -= amount;
                yield ownerWallet.save({ session });
                // Update owner's user model balance
                const owner = yield User_1.default.findById(userId);
                if (owner) {
                    owner.walletBalance -= amount;
                    yield owner.save({ session });
                }
                // Create repayment transaction record for owner
                const reference = `MF-REP-${Date.now()}-${userId.substring(0, 5)}`;
                yield Transaction_1.default.create([{
                        userId,
                        type: 'investment',
                        amount: -amount, // Negative to indicate outgoing
                        status: 'completed',
                        reference,
                        description: `Repayment to investors for ${business.name}`,
                        metadata: {
                            businessId,
                            repaymentType: 'sent',
                        },
                    }], { session });
                // Distribute to investors based on their investment ratio
                const distributionPromises = investments.map((investment) => __awaiter(this, void 0, void 0, function* () {
                    // Calculate investor's share
                    const investorShare = (investment.amount / totalInvested) * amount;
                    const roundedShare = Math.round(investorShare * 100) / 100; // Round to 2 decimal places
                    // Update investment
                    investment.returnsReceived += roundedShare;
                    investment.lastReturnDate = new Date();
                    // If total returns received exceed expected return, mark as completed
                    if (investment.returnsReceived >= investment.expectedReturn) {
                        investment.status = 'completed';
                    }
                    yield investment.save({ session });
                    // Add to investor's wallet
                    const investorWallet = yield wallet_service_1.walletService.getOrCreateWallet(investment.investor.toString());
                    investorWallet.balance += roundedShare;
                    yield investorWallet.save({ session });
                    // Update investor's user model balance
                    const investor = yield User_1.default.findById(investment.investor);
                    if (investor) {
                        investor.walletBalance += roundedShare;
                        yield investor.save({ session });
                    }
                    // Create transaction record for investor
                    yield Transaction_1.default.create([{
                            userId: investment.investor,
                            type: 'return',
                            amount: roundedShare,
                            status: 'completed',
                            reference: `${reference}-${investment.investor.toString().substring(0, 5)}`,
                            description: `Return from investment in ${business.name}`,
                            metadata: {
                                businessId,
                                investmentId: investment._id,
                                repaymentType: 'received',
                            },
                        }], { session });
                    return {
                        investorId: investment.investor,
                        amount: roundedShare,
                    };
                }));
                const distributions = yield Promise.all(distributionPromises);
                yield session.commitTransaction();
                return {
                    totalAmount: amount,
                    distributions,
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
}
exports.BusinessService = BusinessService;
// Export as singleton
exports.businessService = new BusinessService();
