import mongoose, { Document, Schema } from 'mongoose';

export type AchievementType = 
  | 'module_completion' 
  | 'quiz_mastery' 
  | 'learning_streak' 
  | 'category_completion'
  | 'savings_milestone'
  | 'investment_milestone';

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  points: number;
  earnedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserAchievementSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'module_completion',
        'quiz_mastery',
        'learning_streak',
        'category_completion',
        'savings_milestone',
        'investment_milestone',
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
    },
    icon: {
      type: String,
      required: [true, 'Achievement icon is required'],
    },
    points: {
      type: Number,
      required: [true, 'Achievement points are required'],
      min: 1,
    },
    earnedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);