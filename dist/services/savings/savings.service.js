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
exports.savingsService = exports.SavingsService = void 0;
const SavingsGroup_1 = __importDefault(require("@/models/SavingsGroup"));
const GroupMember_1 = __importDefault(require("@/models/GroupMember"));
const User_1 = __importDefault(require("@/models/User"));
const Transaction_1 = __importDefault(require("@/models/Transaction"));
const wallet_service_1 = require("@/services/wallet.service");
const error_1 = __importDefault(require("@/utils/error"));
const mongoose_1 = __importDefault(require("mongoose"));
class SavingsService {
    /**
     * Create a new savings group
     */
    createGroup(userId, groupData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate dates
            const startDate = new Date(groupData.startDate);
            const endDate = new Date(groupData.endDate);
            if (startDate < new Date()) {
                throw new error_1.default('Start date cannot be in the past', 400);
            }
            if (endDate <= startDate) {
                throw new error_1.default('End date must be after start date', 400);
            }
            // Create the group
            const group = yield SavingsGroup_1.default.create(Object.assign(Object.assign({}, groupData), { creator: userId, members: [userId], currentTotal: 0 }));
            // Add creator as a member
            yield GroupMember_1.default.create({
                groupId: group._id,
                userId,
                joinDate: new Date(),
            });
            return group;
        });
    }
    /**
     * Get all available savings groups
     */
    getAllGroups() {
        return __awaiter(this, arguments, void 0, function* (query = {}) {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const skip = (page - 1) * limit;
            // Build filter
            const filter = { isActive: true };
            // Search by name
            if (query.search) {
                filter.name = { $regex: query.search, $options: 'i' };
            }
            // Filter by minimum/maximum target
            if (query.minTarget) {
                filter.targetAmount = Object.assign(Object.assign({}, filter.targetAmount), { $gte: Number(query.minTarget) });
            }
            if (query.maxTarget) {
                filter.targetAmount = Object.assign(Object.assign({}, filter.targetAmount), { $lte: Number(query.maxTarget) });
            }
            // Get groups with member count
            const groups = yield SavingsGroup_1.default.aggregate([
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
            const total = yield SavingsGroup_1.default.countDocuments(filter);
            return {
                groups,
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
     * Get groups created by a user
     */
    getUserGroups(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ownedGroups = yield SavingsGroup_1.default.find({ creator: userId })
                .sort({ createdAt: -1 });
            // Get groups where user is a member but not creator
            const memberGroups = yield GroupMember_1.default.find({
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
        });
    }
    /**
     * Get group details with members
     */
    getGroupDetails(groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            const group = yield SavingsGroup_1.default.findById(groupId);
            if (!group) {
                throw new error_1.default('Group not found', 404);
            }
            // Get members with user details
            const members = yield GroupMember_1.default.find({ groupId })
                .populate('userId', 'fullName email institution department level profileImage')
                .sort({ joinDate: 1 });
            // Get recent contributions
            const recentContributions = yield Transaction_1.default.find({
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
        });
    }
    /**
     * Join a savings group
     */
    joinGroup(userId, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            const group = yield SavingsGroup_1.default.findById(groupId);
            if (!group) {
                throw new error_1.default('Group not found', 404);
            }
            if (!group.isActive) {
                throw new error_1.default('This group is no longer active', 400);
            }
            // Check if user is already a member
            const existingMember = yield GroupMember_1.default.findOne({ groupId, userId });
            if (existingMember) {
                if (existingMember.isActive) {
                    throw new error_1.default('You are already a member of this group', 400);
                }
                // Reactivate membership if previously inactive
                existingMember.isActive = true;
                yield existingMember.save();
                // Add user to members array if not already there
                if (!group.members.includes(userId)) {
                    group.members.push(userId);
                    yield group.save();
                }
                return existingMember;
            }
            // Create new membership
            const member = yield GroupMember_1.default.create({
                groupId,
                userId,
                joinDate: new Date(),
            });
            // Add user to members array
            group.members.push(userId);
            yield group.save();
            return member;
        });
    }
    /**
     * Make a contribution to a group
     */
    makeContribution(userId, groupId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const group = yield SavingsGroup_1.default.findById(groupId);
            if (!group) {
                throw new error_1.default('Group not found', 404);
            }
            if (!group.isActive) {
                throw new error_1.default('This group is no longer active', 400);
            }
            // Check if user is a member
            const member = yield GroupMember_1.default.findOne({ groupId, userId, isActive: true });
            if (!member) {
                throw new error_1.default('You are not a member of this group', 400);
            }
            // Use group contribution amount if not specified
            const contributionAmount = amount || group.contributionAmount;
            // Start a session for transaction
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                // Check if user has sufficient balance
                const wallet = yield wallet_service_1.walletService.getOrCreateWallet(userId);
                if (wallet.balance < contributionAmount) {
                    throw new error_1.default('Insufficient funds in your wallet', 400);
                }
                // Create a unique reference
                const reference = `MF-CONTRIB-${Date.now()}-${userId.substring(0, 5)}`;
                // Create transaction record
                const transaction = yield Transaction_1.default.create([{
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
                    }], { session });
                // Update user's wallet
                wallet.balance -= contributionAmount;
                yield wallet.save({ session });
                // Update user model balance
                const user = yield User_1.default.findById(userId);
                if (user) {
                    user.walletBalance -= contributionAmount;
                    yield user.save({ session });
                }
                // Update group total
                group.currentTotal += contributionAmount;
                yield group.save({ session });
                // Update member contribution records
                member.contributionsMade += 1;
                member.totalContributed += contributionAmount;
                member.lastContributionDate = new Date();
                yield member.save({ session });
                yield session.commitTransaction();
                return {
                    success: true,
                    transaction: transaction[0],
                    newBalance: wallet.balance,
                    groupTotal: group.currentTotal,
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
     * Leave a savings group
     */
    leaveGroup(userId, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            const group = yield SavingsGroup_1.default.findById(groupId);
            if (!group) {
                throw new error_1.default('Group not found', 404);
            }
            // Check if user is a member
            const member = yield GroupMember_1.default.findOne({ groupId, userId, isActive: true });
            if (!member) {
                throw new error_1.default('You are not a member of this group', 400);
            }
            // Cannot leave if you're the creator
            if (group.creator.toString() === userId) {
                throw new error_1.default('Group creator cannot leave the group', 400);
            }
            // Deactivate membership
            member.isActive = false;
            yield member.save();
            // Remove from members array
            group.members = group.members.filter((memberId) => memberId.toString() !== userId);
            yield group.save();
            return { success: true };
        });
    }
    /**
     * Get user's contribution history for a group
     */
    getUserContributions(userId, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if user is a member
            const member = yield GroupMember_1.default.findOne({ groupId, userId });
            if (!member) {
                throw new error_1.default('You are not a member of this group', 400);
            }
            // Convert groupId string to ObjectId
            const objectIdGroupId = new mongoose_1.default.Types.ObjectId(groupId);
            // Get all contributions
            const contributions = yield Transaction_1.default.find({
                userId,
                'metadata.groupId': objectIdGroupId,
                type: 'group_contribution',
            }).sort({ createdAt: -1 });
            return {
                member,
                contributions,
            };
        });
    }
}
exports.SavingsService = SavingsService;
// Export as singleton
exports.savingsService = new SavingsService();
