import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMember extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  joinDate: Date;
  contributionsMade: number;
  totalContributed: number;
  lastContributionDate: Date;
  isActive: boolean;
}

const GroupMemberSchema: Schema = new Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGroup',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    contributionsMade: {
      type: Number,
      default: 0,
    },
    totalContributed: {
      type: Number,
      default: 0,
    },
    lastContributionDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can join a group only once
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);