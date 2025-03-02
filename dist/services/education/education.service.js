"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.educationService = exports.EducationService = void 0;
const EducationModule_1 = __importDefault(require("@/models/EducationModule"));
const UserProgress_1 = __importDefault(require("@/models/UserProgress"));
const UserAchievement_1 = __importDefault(require("@/models/UserAchievement"));
const User_1 = __importDefault(require("@/models/User"));
const error_1 = __importDefault(require("@/utils/error"));
class EducationService {
    /**
     * Get all education modules with filtering
     */
    getAllModules() {
        return __awaiter(this, arguments, void 0, function* (query = {}) {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const skip = (page - 1) * limit;
            // Build filter
            const filter = { isActive: true };
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
            const modules = yield EducationModule_1.default.find(filter)
                .select('-quiz.correctOption -quiz.explanation') // Don't send quiz answers
                .sort(query.sort || 'level')
                .skip(skip)
                .limit(limit);
            // Get total count
            const total = yield EducationModule_1.default.countDocuments(filter);
            return {
                modules,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    /**
     * Get module details
     */
    getModuleDetails(moduleId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const module = yield EducationModule_1.default.findById(moduleId);
            if (!module) {
                throw new error_1.default('Module not found', 404);
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
                userProgress = yield UserProgress_1.default.findOne({
                    userId,
                    moduleId,
                });
            }
            return {
                module: moduleData,
                userProgress,
            };
        });
    }
    /**
     * Submit quiz answers and update progress
     */
    submitQuiz(userId, moduleId, answers) {
        return __awaiter(this, void 0, void 0, function* () {
            const module = yield EducationModule_1.default.findById(moduleId);
            if (!module) {
                throw new error_1.default('Module not found', 404);
            }
            if (!module.quiz || module.quiz.length === 0) {
                throw new error_1.default('This module does not have a quiz', 400);
            }
            if (answers.length !== module.quiz.length) {
                throw new error_1.default(`Please answer all ${module.quiz.length} questions`, 400);
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
                let progress = yield UserProgress_1.default.findOne({ userId, moduleId });
                const isFirstCompletion = !progress || !progress.isCompleted;
                const isImprovedScore = progress && score > progress.quizScore;
                if (progress) {
                    // Only update if score is higher
                    if (score > progress.quizScore) {
                        progress.quizScore = score;
                        progress.isCompleted = passed;
                        progress.lastAttemptDate = new Date();
                        yield progress.save();
                    }
                }
                else {
                    progress = new UserProgress_1.default({
                        userId,
                        moduleId,
                        quizScore: score,
                        isCompleted: passed,
                        lastAttemptDate: new Date(),
                    });
                    yield progress.save();
                }
                // If the user passed and either it's their first completion or they improved their score
                if (passed && (isFirstCompletion || isImprovedScore)) {
                    // Update financial literacy score
                    const user = yield User_1.default.findById(userId);
                    if (user) {
                        // Award points based on module
                        user.financialLiteracyScore = (user.financialLiteracyScore || 0) + module.points;
                        yield user.save();
                        // Check for and award achievements separately (not in the same transaction)
                        yield this.checkAndAwardAchievements(userId, moduleId);
                    }
                }
                return {
                    score,
                    passed,
                    results,
                    progress,
                };
            }
            catch (error) {
                console.error('Error in submitQuiz:', error);
                throw error;
            }
        });
    }
    /**
     * Get user's progress across all modules
     */
    getUserProgress(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all modules
            const modules = yield EducationModule_1.default.find({ isActive: true })
                .select('_id title description level category points duration');
            // Get user's progress for all modules
            const progress = yield UserProgress_1.default.find({ userId });
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
            const achievements = yield UserAchievement_1.default.find({ userId })
                .sort('-earnedDate');
            // Get current literacy score
            const user = yield User_1.default.findById(userId).select('financialLiteracyScore');
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
        });
    }
    /**
     * Get leaderboard
     */
    getLeaderboard() {
        return __awaiter(this, void 0, void 0, function* () {
            const leaderboard = yield User_1.default.find({ financialLiteracyScore: { $gt: 0 } })
                .select('_id fullName email institution department financialLiteracyScore')
                .sort('-financialLiteracyScore')
                .limit(10);
            return leaderboard;
        });
    }
    /**
     * Private: Check and award achievements
     */
    checkAndAwardAchievements(userId, moduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all user progress
                const allProgress = yield UserProgress_1.default.find({ userId });
                const completedProgress = allProgress.filter(p => p.isCompleted);
                // Get the completed module
                const module = yield EducationModule_1.default.findById(moduleId);
                // Achievement 1: First module completion
                if (completedProgress.length === 1) {
                    yield this.awardAchievement(userId, 'module_completion', 'First Steps', 'Completed your first learning module', 'trophy', 10);
                }
                // Achievement 2: Perfect score
                const perfectScores = allProgress.filter(p => p.quizScore === 100);
                if (perfectScores.length === 1) {
                    yield this.awardAchievement(userId, 'quiz_mastery', 'Perfect Score', 'Scored 100% on a quiz', 'star', 20);
                }
                // Achievement 3: Complete 5 modules
                if (completedProgress.length === 5) {
                    yield this.awardAchievement(userId, 'learning_streak', 'Learning Enthusiast', 'Completed 5 learning modules', 'books', 30);
                }
                // Achievement 4: Category mastery (complete all modules in a category)
                if (module) {
                    const categoryModules = yield EducationModule_1.default.find({ category: module.category });
                    const completedCategoryModuleIds = completedProgress.map(p => p.moduleId.toString());
                    const allCategoryModulesCompleted = categoryModules.every(m => completedCategoryModuleIds.includes(m._id.toString()));
                    if (allCategoryModulesCompleted && categoryModules.length > 1) {
                        yield this.awardAchievement(userId, 'category_completion', `${module.category} Expert`, `Mastered all modules in the ${module.category} category`, 'certificate', 50);
                    }
                }
            }
            catch (error) {
                console.error('Error in checkAndAwardAchievements:', error);
                // Log error but don't prevent quiz submission
            }
        });
    }
    /**
     * Private: Award achievement helper
     */
    awardAchievement(userId, type, title, description, icon, points) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if user already has this achievement
                const existingAchievement = yield UserAchievement_1.default.findOne({
                    userId,
                    type,
                    title,
                });
                if (!existingAchievement) {
                    // Create achievement
                    yield UserAchievement_1.default.create({
                        userId,
                        type,
                        title,
                        description,
                        icon,
                        points,
                        earnedDate: new Date(),
                    });
                    // Add points to user's score
                    const user = yield User_1.default.findById(userId);
                    if (user) {
                        user.financialLiteracyScore = (user.financialLiteracyScore || 0) + points;
                        yield user.save();
                    }
                }
            }
            catch (error) {
                console.error('Error in awardAchievement:', error);
                // Log error but don't prevent achievement awarding
            }
        });
    }
    /**
     * Create education module (admin only)
     */
    createModule(moduleData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate quiz questions
            if (moduleData.quiz && moduleData.quiz.length > 0) {
                moduleData.quiz.forEach((question, index) => {
                    if (!question.question || !question.options || !question.explanation) {
                        throw new error_1.default(`Question ${index + 1} is missing required fields`, 400);
                    }
                    if (question.options.length < 2) {
                        throw new error_1.default(`Question ${index + 1} must have at least 2 options`, 400);
                    }
                    if (question.correctOption < 0 || question.correctOption >= question.options.length) {
                        throw new error_1.default(`Question ${index + 1} has an invalid correct option index`, 400);
                    }
                });
            }
            // Create module
            const module = yield EducationModule_1.default.create(moduleData);
            return module;
        });
    }
}
exports.EducationService = EducationService;
// Export as singleton
exports.educationService = new EducationService();
