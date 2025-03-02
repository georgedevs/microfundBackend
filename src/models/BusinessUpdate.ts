import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessUpdate extends Document {
  businessId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BusinessUpdateSchema: Schema = new Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Update title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Update content is required'],
    },
    images: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBusinessUpdate>('BusinessUpdate', BusinessUpdateSchema);