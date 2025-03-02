import mongoose, { Document, Schema } from 'mongoose';

export interface IBank extends Document {
  code: string;
  name: string;
  isActive: boolean;
}

const BankSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
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

export default mongoose.model<IBank>('Bank', BankSchema);