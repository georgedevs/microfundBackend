import mongoose, { Document, Schema } from 'mongoose';

export type BusinessCategory = 
  | 'technology' 
  | 'food' 
  | 'fashion' 
  | 'education' 
  | 'health' 
  | 'transportation' 
  | 'entertainment'
  | 'services'
  | 'retail'
  | 'other';

export type BusinessStatus = 'draft' | 'active' | 'funded' | 'completed' | 'inactive';

export interface IBusiness extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: BusinessCategory;
  profileImage?: string;
  coverImage?: string;
  fundingGoal: number;
  raisedAmount: number;
  expectedReturnRate: number;
  duration: number; // in months
  hasProducts: boolean;
  location: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  status: BusinessStatus;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema: Schema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Business description is required'],
    },
    category: {
      type: String,
      enum: [
        'technology', 
        'food', 
        'fashion', 
        'education', 
        'health', 
        'transportation', 
        'entertainment',
        'services',
        'retail',
        'other'
      ],
      required: [true, 'Business category is required'],
    },
    profileImage: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    fundingGoal: {
      type: Number,
      required: [true, 'Funding goal is required'],
      min: 0,
    },
    raisedAmount: {
      type: Number,
      default: 0,
    },
    expectedReturnRate: {
      type: Number,
      required: [true, 'Expected return rate is required'],
      min: 0,
      max: 100,
    },
    duration: {
      type: Number,
      required: [true, 'Investment duration is required'],
      min: 1,
    },
    hasProducts: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      required: [true, 'Business location is required'],
    },
    contactEmail: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    contactPhone: {
      type: String,
    },
    socialLinks: {
      website: String,
      instagram: String,
      twitter: String,
      facebook: String,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'funded', 'completed', 'inactive'],
      default: 'draft',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBusiness>('Business', BusinessSchema);