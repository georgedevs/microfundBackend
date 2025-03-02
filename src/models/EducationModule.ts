import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface IEducationModule extends Document {
  title: string;
  description: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  duration: number; // in minutes
  points: number;
  quiz: IQuizQuestion[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [
      (options: string[]) => options.length >= 2,
      'Quiz questions must have at least 2 options',
    ],
  },
  correctOption: {
    type: Number,
    required: true,
    min: 0,
  },
  explanation: {
    type: String,
    required: true,
  },
});

const EducationModuleSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Module description is required'],
    },
    content: {
      type: String,
      required: [true, 'Module content is required'],
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    category: {
      type: String,
      required: [true, 'Module category is required'],
    },
    duration: {
      type: Number,
      required: [true, 'Module duration is required'],
      min: 1,
    },
    points: {
      type: Number,
      required: [true, 'Module points are required'],
      min: 1,
    },
    quiz: [QuizQuestionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEducationModule>('EducationModule', EducationModuleSchema);