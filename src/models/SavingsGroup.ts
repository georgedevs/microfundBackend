import mongoose, { Document, Schema } from 'mongoose';

export interface ISavingsGroup extends Document {
  name: string;
  description: string;
  creator: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  targetAmount: number;
  contributionAmount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  currentTotal: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGroupSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Group description is required'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: 0,
    },
    contributionAmount: {
      type: Number,
      required: [true, 'Contribution amount is required'],
      min: 0,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'weekly',
    },
    currentTotal: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
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

export default mongoose.model<ISavingsGroup>('SavingsGroup', SavingsGroupSchema);