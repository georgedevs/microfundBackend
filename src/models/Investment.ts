import mongoose, { Document, Schema } from 'mongoose';

export type InvestmentStatus = 'active' | 'completed' | 'defaulted';

export interface IInvestment extends Document {
  investor: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  amount: number;
  expectedReturn: number;
  investmentDate: Date;
  maturityDate: Date;
  status: InvestmentStatus;
  returnsReceived: number;
  lastReturnDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema: Schema = new Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: 0,
    },
    expectedReturn: {
      type: Number,
      required: [true, 'Expected return is required'],
      min: 0,
    },
    investmentDate: {
      type: Date,
      default: Date.now,
    },
    maturityDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'defaulted'],
      default: 'active',
    },
    returnsReceived: {
      type: Number,
      default: 0,
    },
    lastReturnDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInvestment>('Investment', InvestmentSchema);