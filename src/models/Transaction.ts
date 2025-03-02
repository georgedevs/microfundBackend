import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'investment' 
  | 'return' 
  | 'group_contribution' 
  | 'group_distribution';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  fee: number;
  status: TransactionStatus;
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'investment', 'return', 'group_contribution', 'group_distribution'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true, 
  }
);

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);