import EducationModule, { IQuizQuestion } from '@/models/EducationModule';
import UserProgress from '@/models/UserProgress';
import UserAchievement from '@/models/UserAchievement';
import User from '@/models/User';
import AppError from '@/utils/error';
import mongoose from 'mongoose';

export class EducationService {
  /**
   * Get all education modules with filtering
   */
  async getAllModules(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isActive: true };

    // Filter by level
    if (query.level) {
      filter.level = query.level;
    }

    // Filter by category
    if (query.category) {
      filter.category = query.category;
    }

    // Search by title or description
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Get modules
    const modules = await EducationModule.find(filter)
      .select('-quiz.correctOption -quiz.explanation') // Don't send quiz answers
      .sort(query.sort || 'level')
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await EducationModule.countDocuments(filter);

    return {
      modules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get module details
   */
  async getModuleDetails(moduleId: string, userId?: string) {
    const module = await EducationModule.findById(moduleId);

    if (!module) {
      throw new AppError('Module not found', 404);
    }

    // Don't send quiz answers
    const moduleData = module.toObject();
    if (moduleData.quiz && moduleData.quiz.length > 0) {
      moduleData.quiz = moduleData.quiz.map(q => ({
        question: q.question,
        options: q.options,
        // Omit correctOption and explanation
      }));
    }

    // If userId is provided, get user progress
    let userProgress = null;
    if (userId) {
      userProgress = await UserProgress.findOne({
        userId,
        moduleId,
      });
    }

    return {
      module: moduleData,
      userProgress,
    };
  }

/**
 * Submit quiz answers and update progress
 */
async submitQuiz(userId: string, moduleId: string, answers: number[]) {
  const module = await EducationModule.findById(moduleId);

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  if (!module.quiz || module.quiz.length === 0) {
    throw new AppError('This module does not have a quiz', 400);
  }

  if (answers.length !== module.quiz.length) {
    throw new AppError(`Please answer all ${module.quiz.length} questions`, 400);
  }

  // Calculate score
  let correctAnswers = 0;
  const results = module.quiz.map((question, index) => {
    const isCorrect = answers[index] === question.correctOption;
    if (isCorrect) {
      correctAnswers++;
    }
    return {
      question: question.question,
      userAnswer: answers[index],
      correctAnswer: question.correctOption,
      isCorrect,
      explanation: question.explanation,
    };
  });

  const score = Math.round((correctAnswers / module.quiz.length) * 100);
  const passed = score >= 70; // 70% passing score

  try {
    // Update or create user progress
    let progress = await UserProgress.findOne({ userId, moduleId });
    const isFirstCompletion = !progress || !progress.isCompleted;
    const isImprovedScore = progress && score > progress.quizScore;

    if (progress) {
      // Only update if score is higher
      if (score > progress.quizScore) {
        progress.quizScore = score;
        progress.isCompleted = passed;
        progress.lastAttemptDate = new Date();
        await progress.save();
      }
    } else {
      progress = new UserProgress({
        userId,
        moduleId,
        quizScore: score,
        isCompleted: passed,
        lastAttemptDate: new Date(),
      });
      await progress.save();
    }

    // If the user passed and either it's their first completion or they improved their score
    if (passed && (isFirstCompletion || isImprovedScore)) {
      // Update financial literacy score
      const user = await User.findById(userId);
      if (user) {
        // Award points based on module
        user.financialLiteracyScore = (user.financialLiteracyScore || 0) + module.points;
        await user.save();

        // Check for and award achievements separately (not in the same transaction)
        await this.checkAndAwardAchievements(userId, moduleId);
      }
    }

    return {
      score,
      passed,
      results,
      progress,
    };
  } catch (error) {
    console.error('Error in submitQuiz:', error);
    throw error;
  }
}


  /**
   * Get user's progress across all modules
   */
  async getUserProgress(userId: string) {
    // Get all modules
    const modules = await EducationModule.find({ isActive: true })
      .select('_id title description level category points duration');

    // Get user's progress for all modules
    const progress = await UserProgress.find({ userId });

    // Create a map for easy lookup
    const progressMap = progress.reduce((map, item) => {
      map[item.moduleId.toString()] = item;
      return map;
    }, {});

    // Combine module info with progress
    const modulesWithProgress = modules.map(module => {
      const userProgress = progressMap[module._id.toString()];
      return {
        module,
        progress: userProgress || {
          isCompleted: false,
          quizScore: 0,
          lastAttemptDate: null,
        },
      };
    });

    // Get total completion percentage
    const completedCount = progress.filter(p => p.isCompleted).length;
    const completionPercentage = modules.length > 0
      ? Math.round((completedCount / modules.length) * 100)
      : 0;

    // Get achievements
    const achievements = await UserAchievement.find({ userId })
      .sort('-earnedDate');

    // Get current literacy score
    const user = await User.findById(userId).select('financialLiteracyScore');

    return {
      modules: modulesWithProgress,
      stats: {
        totalModules: modules.length,
        completedModules: completedCount,
        completionPercentage,
        financialLiteracyScore: user ? user.financialLiteracyScore : 0,
      },
      achievements,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    const leaderboard = await User.find({ financialLiteracyScore: { $gt: 0 } })
      .select('_id fullName email institution department financialLiteracyScore')
      .sort('-financialLiteracyScore')
      .limit(10);

    return leaderboard;
  }

/**
 * Private: Check and award achievements
 */
private async checkAndAwardAchievements(
    userId: string,
    moduleId: string
  ) {
    try {
      // Get all user progress
      const allProgress = await UserProgress.find({ userId });
      const completedProgress = allProgress.filter(p => p.isCompleted);
  
      // Get the completed module
      const module = await EducationModule.findById(moduleId);
      
      // Achievement 1: First module completion
      if (completedProgress.length === 1) {
        await this.awardAchievement(
          userId,
          'module_completion',
          'First Steps',
          'Completed your first learning module',
          'trophy',
          10
        );
      }
  
      // Achievement 2: Perfect score
      const perfectScores = allProgress.filter(p => p.quizScore === 100);
      if (perfectScores.length === 1) {
        await this.awardAchievement(
          userId,
          'quiz_mastery',
          'Perfect Score',
          'Scored 100% on a quiz',
          'star',
          20
        );
      }
  
      // Achievement 3: Complete 5 modules
      if (completedProgress.length === 5) {
        await this.awardAchievement(
          userId,
          'learning_streak',
          'Learning Enthusiast',
          'Completed 5 learning modules',
          'books',
          30
        );
      }
  
      // Achievement 4: Category mastery (complete all modules in a category)
      if (module) {
        const categoryModules = await EducationModule.find({ category: module.category });
        const completedCategoryModuleIds = completedProgress.map(p => p.moduleId.toString());
        
        const allCategoryModulesCompleted = categoryModules.every(m => 
          completedCategoryModuleIds.includes(m._id.toString())
        );
  
        if (allCategoryModulesCompleted && categoryModules.length > 1) {
          await this.awardAchievement(
            userId,
            'category_completion',
            `${module.category} Expert`,
            `Mastered all modules in the ${module.category} category`,
            'certificate',
            50
          );
        }
      }
    } catch (error) {
      console.error('Error in checkAndAwardAchievements:', error);
      // Log error but don't prevent quiz submission
    }
  }

/**
 * Private: Award achievement helper
 */
private async awardAchievement(
    userId: string,
    type: string,
    title: string,
    description: string,
    icon: string,
    points: number
  ) {
    try {
      // Check if user already has this achievement
      const existingAchievement = await UserAchievement.findOne({
        userId,
        type,
        title,
      });
  
      if (!existingAchievement) {
        // Create achievement
        await UserAchievement.create({
          userId,
          type,
          title,
          description,
          icon,
          points,
          earnedDate: new Date(),
        });
  
        // Add points to user's score
        const user = await User.findById(userId);
        if (user) {
          user.financialLiteracyScore = (user.financialLiteracyScore || 0) + points;
          await user.save();
        }
      }
    } catch (error) {
      console.error('Error in awardAchievement:', error);
      // Log error but don't prevent achievement awarding
    }
  }

  /**
   * Create education module (admin only)
   */
  async createModule(moduleData: {
    title: string;
    description: string;
    content: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    duration: number;
    points: number;
    quiz: IQuizQuestion[];
  }) {
    // Validate quiz questions
    if (moduleData.quiz && moduleData.quiz.length > 0) {
      moduleData.quiz.forEach((question, index) => {
        if (!question.question || !question.options || !question.explanation) {
          throw new AppError(`Question ${index + 1} is missing required fields`, 400);
        }

        if (question.options.length < 2) {
          throw new AppError(`Question ${index + 1} must have at least 2 options`, 400);
        }

        if (question.correctOption < 0 || question.correctOption >= question.options.length) {
          throw new AppError(`Question ${index + 1} has an invalid correct option index`, 400);
        }
      });
    }

    // Create module
    const module = await EducationModule.create(moduleData);

    return module;
  }
}

// Export as singleton
export const educationService = new EducationService();