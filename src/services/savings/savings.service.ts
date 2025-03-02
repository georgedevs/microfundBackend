import SavingsGroup, { ISavingsGroup } from '@/models/SavingsGroup';
import GroupMember from '@/models/GroupMember';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { walletService } from '@/services/wallet.service';
import AppError from '@/utils/error';
import mongoose from 'mongoose';

export class SavingsService {
  /**
   * Create a new savings group
   */
  async createGroup(
    userId: string,
    groupData: {
      name: string;
      description: string;
      targetAmount: number;
      contributionAmount: number;
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
      startDate: Date;
      endDate: Date;
    }
  ) {
    // Validate dates
    const startDate = new Date(groupData.startDate);
    const endDate = new Date(groupData.endDate);
    
    if (startDate < new Date()) {
      throw new AppError('Start date cannot be in the past', 400);
    }
    
    if (endDate <= startDate) {
      throw new AppError('End date must be after start date', 400);
    }
    
    // Create the group
    const group = await SavingsGroup.create({
      ...groupData,
      creator: userId,
      members: [userId], // Creator is automatically a member
      currentTotal: 0,
    });
    
    // Add creator as a member
    await GroupMember.create({
      groupId: group._id,
      userId,
      joinDate: new Date(),
    });
    
    return group;
  }
  
  /**
   * Get all available savings groups
   */
  async getAllGroups(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter: any = { isActive: true };
    
    // Search by name
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }
    
    // Filter by minimum/maximum target
    if (query.minTarget) {
      filter.targetAmount = { ...filter.targetAmount, $gte: Number(query.minTarget) };
    }
    
    if (query.maxTarget) {
      filter.targetAmount = { ...filter.targetAmount, $lte: Number(query.maxTarget) };
    }
    
    // Get groups with member count
    const groups = await SavingsGroup.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'groupmembers',
          localField: '_id',
          foreignField: 'groupId',
          as: 'membersData',
        },
      },
      {
        $addFields: {
          memberCount: { $size: '$membersData' },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          membersData: 0, // Remove the lookup data
        },
      },
    ]);
    
    // Get total count
    const total = await SavingsGroup.countDocuments(filter);
    
    return {
      groups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
  
  /**
   * Get groups created by a user
   */
  async getUserGroups(userId: string) {
    const ownedGroups = await SavingsGroup.find({ creator: userId })
      .sort({ createdAt: -1 });
    
    // Get groups where user is a member but not creator
    const memberGroups = await GroupMember.find({ 
      userId, 
      isActive: true 
    })
      .populate({
        path: 'groupId',
        match: { creator: { $ne: userId }, isActive: true },
      })
      .sort({ createdAt: -1 });
    
    // Filter out null groupId (in case the group is not active)
    const joinedGroups = memberGroups
      .filter(member => member.groupId)
      .map(member => member.groupId);
    
    return {
      ownedGroups,
      joinedGroups,
    };
  }
  
  /**
   * Get group details with members
   */
  async getGroupDetails(groupId: string) {
    const group = await SavingsGroup.findById(groupId);
    
    if (!group) {
      throw new AppError('Group not found', 404);
    }
    
    // Get members with user details
    const members = await GroupMember.find({ groupId })
      .populate('userId', 'fullName email institution department level profileImage')
      .sort({ joinDate: 1 });
    
    // Get recent contributions
    const recentContributions = await Transaction.find({
      'metadata.groupId': groupId,
      type: 'group_contribution',
    })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return {
      group,
      members,
      recentContributions,
    };
  }
  
  /**
   * Join a savings group
   */
  async joinGroup(userId: string, groupId: string) {
    const group = await SavingsGroup.findById(groupId);
    
    if (!group) {
      throw new AppError('Group not found', 404);
    }
    
    if (!group.isActive) {
      throw new AppError('This group is no longer active', 400);
    }
    
    // Check if user is already a member
    const existingMember = await GroupMember.findOne({ groupId, userId });
    if (existingMember) {
      if (existingMember.isActive) {
        throw new AppError('You are already a member of this group', 400);
      }
      
      // Reactivate membership if previously inactive
      existingMember.isActive = true;
      await existingMember.save();
      
      // Add user to members array if not already there
      if (!group.members.includes(userId as any)) {
        group.members.push(userId as any);
        await group.save();
      }
      
      return existingMember;
    }
    
    // Create new membership
    const member = await GroupMember.create({
      groupId,
      userId,
      joinDate: new Date(),
    });
    
    // Add user to members array
    group.members.push(userId as any);
    await group.save();
    
    return member;
  }
  
  /**
   * Make a contribution to a group
   */
  async makeContribution(userId: string, groupId: string, amount?: number) {
    const group = await SavingsGroup.findById(groupId);
    
    if (!group) {
      throw new AppError('Group not found', 404);
    }
    
    if (!group.isActive) {
      throw new AppError('This group is no longer active', 400);
    }
    
    // Check if user is a member
    const member = await GroupMember.findOne({ groupId, userId, isActive: true });
    if (!member) {
      throw new AppError('You are not a member of this group', 400);
    }
    
    // Use group contribution amount if not specified
    const contributionAmount = amount || group.contributionAmount;
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check if user has sufficient balance
      const wallet = await walletService.getOrCreateWallet(userId);
      
      if (wallet.balance < contributionAmount) {
        throw new AppError('Insufficient funds in your wallet', 400);
      }
      
      // Create a unique reference
      const reference = `MF-CONTRIB-${Date.now()}-${userId.substring(0, 5)}`;
      
      // Create transaction record
      const transaction = await Transaction.create(
        [{
          userId,
          type: 'group_contribution',
          amount: contributionAmount,
          status: 'completed',
          reference,
          description: `Contribution to ${group.name}`,
          metadata: {
            groupId: group._id,
            contributionAmount,
          },
        }], 
        { session }
      );
      
      // Update user's wallet
      wallet.balance -= contributionAmount;
      await wallet.save({ session });
      
      // Update user model balance
      const user = await User.findById(userId);
      if (user) {
        user.walletBalance -= contributionAmount;
        await user.save({ session });
      }
      
      // Update group total
      group.currentTotal += contributionAmount;
      await group.save({ session });
      
      // Update member contribution records
      member.contributionsMade += 1;
      member.totalContributed += contributionAmount;
      member.lastContributionDate = new Date();
      await member.save({ session });
      
      await session.commitTransaction();
      
      return {
        success: true,
        transaction: transaction[0],
        newBalance: wallet.balance,
        groupTotal: group.currentTotal,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Leave a savings group
   */
  async leaveGroup(userId: string, groupId: string) {
    const group = await SavingsGroup.findById(groupId);
    
    if (!group) {
      throw new AppError('Group not found', 404);
    }
    
    // Check if user is a member
    const member = await GroupMember.findOne({ groupId, userId, isActive: true });
    if (!member) {
      throw new AppError('You are not a member of this group', 400);
    }
    
    // Cannot leave if you're the creator
    if (group.creator.toString() === userId) {
      throw new AppError('Group creator cannot leave the group', 400);
    }
    
    // Deactivate membership
    member.isActive = false;
    await member.save();
    
    // Remove from members array
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId
    );
    await group.save();
    
    return { success: true };
  }
  
  /**
   * Get user's contribution history for a group
   */
  async getUserContributions(userId: string, groupId: string) {
    // Check if user is a member
    const member = await GroupMember.findOne({ groupId, userId });
    if (!member) {
      throw new AppError('You are not a member of this group', 400);
    }
    
    // Convert groupId string to ObjectId
    const objectIdGroupId = new mongoose.Types.ObjectId(groupId);
    
    // Get all contributions
    const contributions = await Transaction.find({
      userId,
      'metadata.groupId': objectIdGroupId,
      type: 'group_contribution',
    }).sort({ createdAt: -1 });
    
    return {
      member,
      contributions,
    };
  }
}

// Export as singleton
export const savingsService = new SavingsService();