import Business, { BusinessCategory, IBusiness } from '@/models/Business';
import BusinessUpdate from '@/models/BusinessUpdate';
import Investment from '@/models/Investment';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { walletService } from '@/services/wallet.service';
import AppError from '@/utils/error';
import mongoose from 'mongoose';

export class BusinessService {
  /**
   * Create a new business profile
   */
  async createBusiness(
    userId: string,
    businessData: {
      name: string;
      description: string;
      category: BusinessCategory;
      fundingGoal: number;
      expectedReturnRate: number;
      duration: number;
      location: string;
      contactEmail?: string;
      contactPhone?: string;
      socialLinks?: {
        website?: string;
        instagram?: string;
        twitter?: string;
        facebook?: string;
      };
    }
  ) {
    // Validate business data
    if (!businessData.name || !businessData.description || !businessData.category) {
      throw new AppError('Please provide all required business details', 400);
    }

    if (businessData.fundingGoal <= 0) {
      throw new AppError('Funding goal must be greater than 0', 400);
    }

    if (businessData.expectedReturnRate < 0 || businessData.expectedReturnRate > 100) {
      throw new AppError('Expected return rate must be between 0 and 100', 400);
    }

    if (businessData.duration < 1) {
      throw new AppError('Duration must be at least 1 month', 400);
    }

    // Check if user already has a business with the same name
    const existingBusiness = await Business.findOne({ 
      owner: userId,
      name: businessData.name 
    });

    if (existingBusiness) {
      throw new AppError('You already have a business with this name', 400);
    }

    // Create business profile
    const business = await Business.create({
      owner: userId,
      ...businessData,
      status: 'draft',
    });

    return business;
  }

  /**
   * Get all businesses with filtering and pagination
   */
  async getAllBusinesses(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { status: 'active' };

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
      filter.fundingGoal = { ...filter.fundingGoal, $gte: Number(query.minFunding) };
    }

    if (query.maxFunding) {
      filter.fundingGoal = { ...filter.fundingGoal, $lte: Number(query.maxFunding) };
    }

    // Filter by return rate
    if (query.minReturn) {
      filter.expectedReturnRate = { ...filter.expectedReturnRate, $gte: Number(query.minReturn) };
    }

    if (query.maxReturn) {
      filter.expectedReturnRate = { ...filter.expectedReturnRate, $lte: Number(query.maxReturn) };
    }

    // Get businesses with funding progress
    const businesses = await Business.find(filter)
      .populate('owner', 'fullName email institution department level profileImage')
      .sort(query.sort || '-createdAt')
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Business.countDocuments(filter);

    return {
      businesses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get businesses owned by a user
   */
  async getUserBusinesses(userId: string) {
    const businesses = await Business.find({ owner: userId })
      .sort('-createdAt');

    return businesses;
  }

  /**
   * Get business details with updates and investors
   */
  async getBusinessDetails(businessId: string) {
    const business = await Business.findById(businessId)
      .populate('owner', 'fullName email institution department level profileImage');

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    // Get business updates
    const updates = await BusinessUpdate.find({ businessId })
      .sort('-createdAt');

    // Get investor count and total investments
    const investments = await Investment.find({ business: businessId });
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
  }

  /**
   * Update business profile
   */
  async updateBusiness(userId: string, businessId: string, updateData: Partial<IBusiness>) {
    const business = await Business.findById(businessId);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    // Check if user is the owner
    if (business.owner.toString() !== userId) {
      throw new AppError('You are not authorized to update this business', 403);
    }

    // Don't allow updating certain fields
    const protectedFields = ['owner', 'raisedAmount', 'status', 'verificationStatus'];
    protectedFields.forEach(field => {
      if (updateData[field]) {
        delete updateData[field];
      }
    });

    // Update business
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedBusiness;
  }

  /**
   * Publish business profile (change status from draft to active)
   */
  async publishBusiness(userId: string, businessId: string) {
    const business = await Business.findById(businessId);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    // Check if user is the owner
    if (business.owner.toString() !== userId) {
      throw new AppError('You are not authorized to publish this business', 403);
    }

    // Check if business is in draft status
    if (business.status !== 'draft') {
      throw new AppError('Business is already published', 400);
    }

    // Update status to active
    business.status = 'active';
    await business.save();

    return business;
  }

  /**
   * Add business update
   */
  async addBusinessUpdate(
    userId: string,
    businessId: string,
    updateData: {
      title: string;
      content: string;
      images?: string[];
    }
  ) {
    const business = await Business.findById(businessId);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    // Check if user is the owner
    if (business.owner.toString() !== userId) {
      throw new AppError('You are not authorized to add updates to this business', 403);
    }

    // Create update
    const update = await BusinessUpdate.create({
      businessId,
      ...updateData,
    });

    return update;
  }

  /**
   * Invest in a business
   */
  async investInBusiness(userId: string, businessId: string, amount: number) {
    if (amount <= 0) {
      throw new AppError('Investment amount must be greater than 0', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get business
      const business = await Business.findById(businessId).session(session);

      if (!business) {
        throw new AppError('Business not found', 404);
      }

      // Check if business is active
      if (business.status !== 'active') {
        throw new AppError('This business is not accepting investments at this time', 400);
      }

      // Check if user is the owner
      if (business.owner.toString() === userId) {
        throw new AppError('You cannot invest in your own business', 400);
      }

      // Calculate expected return
      const expectedReturn = amount + (amount * business.expectedReturnRate / 100);

      // Calculate maturity date
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + business.duration);

      // Check if user has sufficient balance
      const wallet = await walletService.getOrCreateWallet(userId);
      if (wallet.balance < amount) {
        throw new AppError('Insufficient funds in your wallet', 400);
      }

      // Create unique reference
      const reference = `MF-INV-${Date.now()}-${userId.substring(0, 5)}`;

      // Create investment record
      const investment = await Investment.create(
        [{
          investor: userId,
          business: businessId,
          amount,
          expectedReturn,
          investmentDate: new Date(),
          maturityDate,
          status: 'active',
          returnsReceived: 0,
        }],
        { session }
      );

      // Update business raised amount
      business.raisedAmount += amount;
      
      // If funding goal is reached, update status
      if (business.raisedAmount >= business.fundingGoal) {
        business.status = 'funded';
      }
      
      await business.save({ session });

      // Deduct from investor's wallet
      wallet.balance -= amount;
      await wallet.save({ session });

      // Update user model balance
      const investor = await User.findById(userId);
      if (investor) {
        investor.walletBalance -= amount;
        await investor.save({ session });
      }

      // Create transaction record
      await Transaction.create(
        [{
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
        }],
        { session }
      );

      // Add funds to business owner's wallet
      const ownerWallet = await walletService.getOrCreateWallet(business.owner.toString());
      ownerWallet.balance += amount;
      await ownerWallet.save({ session });

      // Update owner's user model balance
      const owner = await User.findById(business.owner);
      if (owner) {
        owner.walletBalance += amount;
        await owner.save({ session });
      }

      // Create transaction record for business owner
      await Transaction.create(
        [{
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
        }],
        { session }
      );

      await session.commitTransaction();

      return {
        investment: investment[0],
        business,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get user's investments
   */
  async getUserInvestments(userId: string) {
    const investments = await Investment.find({ investor: userId })
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
  }

  /**
   * Make a repayment to investors
   */
  async makeRepayment(
    userId: string,
    businessId: string,
    amount: number
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get business
      const business = await Business.findById(businessId).session(session);

      if (!business) {
        throw new AppError('Business not found', 404);
      }

      // Check if user is the owner
      if (business.owner.toString() !== userId) {
        throw new AppError('You are not authorized to make repayments for this business', 403);
      }

      // Get owner's wallet
      const ownerWallet = await walletService.getOrCreateWallet(userId);
      
      // Check if owner has sufficient balance
      if (ownerWallet.balance < amount) {
        throw new AppError('Insufficient funds in your wallet', 400);
      }

      // Get active investments for this business
      const investments = await Investment.find({ 
        business: businessId,
        status: 'active',
      }).session(session);

      if (investments.length === 0) {
        throw new AppError('No active investments found for this business', 400);
      }

      // Calculate total invested amount for distribution ratio
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      
      // Deduct from owner's wallet
      ownerWallet.balance -= amount;
      await ownerWallet.save({ session });
      
      // Update owner's user model balance
      const owner = await User.findById(userId);
      if (owner) {
        owner.walletBalance -= amount;
        await owner.save({ session });
      }

      // Create repayment transaction record for owner
      const reference = `MF-REP-${Date.now()}-${userId.substring(0, 5)}`;
      
      await Transaction.create(
        [{
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
        }],
        { session }
      );

      // Distribute to investors based on their investment ratio
      const distributionPromises = investments.map(async (investment) => {
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
        
        await investment.save({ session });
        
        // Add to investor's wallet
        const investorWallet = await walletService.getOrCreateWallet(investment.investor.toString());
        investorWallet.balance += roundedShare;
        await investorWallet.save({ session });
        
        // Update investor's user model balance
        const investor = await User.findById(investment.investor);
        if (investor) {
          investor.walletBalance += roundedShare;
          await investor.save({ session });
        }
        
        // Create transaction record for investor
        await Transaction.create(
          [{
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
          }],
          { session }
        );
        
        return {
          investorId: investment.investor,
          amount: roundedShare,
        };
      });
      
      const distributions = await Promise.all(distributionPromises);
      
      await session.commitTransaction();
      
      return {
        totalAmount: amount,
        distributions,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

// Export as singleton
export const businessService = new BusinessService();