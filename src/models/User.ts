import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  supabaseId: string;
  fullName: string;
  email: string;
  institution: string;
  department: string;
  level: string;
  studentId?: string;
  walletBalance: number;
  financialLiteracyScore: number;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    supabaseId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    institution: {
      type: String,
      required: [true, 'Please add your institution'],
    },
    department: {
      type: String,
      required: [true, 'Please add your department'],
    },
    level: {
      type: String,
      required: [true, 'Please add your level'],
    },
    studentId: {
      type: String,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    financialLiteracyScore: {
      type: Number,
      default: 0,
    },
    profileImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);