import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  squadVirtualAccountId?: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    squadVirtualAccountId: {
      type: String,
      unique: true,
      sparse: true,
    },
    accountNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    accountName: {
      type: String,
    },
    bankName: {
      type: String,
      default: 'Squad Microfinance Bank',
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
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

export default mongoose.model<IWallet>('Wallet', WalletSchema);