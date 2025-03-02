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
exports.createModule = exports.getLeaderboard = exports.getUserProgress = exports.submitQuiz = exports.getModuleDetails = exports.getAllModules = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const education_service_1 = require("@/services/education/education.service");
const error_1 = __importDefault(require("@/utils/error"));
/**
 * Get all education modules
 * @route GET /api/education/modules
 * @access Public
 */
exports.getAllModules = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield education_service_1.educationService.getAllModules(req.query);
    res.status(200).json({
        success: true,
        data: result,
    });
}));
/**
 * Get module details
 * @route GET /api/education/modules/:id
 * @access Public
 */
exports.getModuleDetails = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield education_service_1.educationService.getModuleDetails(id, userId);
    res.status(200).json({
        success: true,
        data: result,
    });
}));
/**
 * Submit quiz answers
 * @route POST /api/education/modules/:id/submit
 * @access Private
 */
exports.submitQuiz = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
        return next(new error_1.default('Please provide answers as an array', 400));
    }
    const result = yield education_service_1.educationService.submitQuiz(userId, id, answers);
    res.status(200).json({
        success: true,
        message: result.passed
            ? 'Congratulations! You passed the quiz.'
            : 'You did not pass the quiz. Try again!',
        data: result,
    });
}));
/**
 * Get user's progress
 * @route GET /api/education/progress
 * @access Private
 */
exports.getUserProgress = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield education_service_1.educationService.getUserProgress(userId);
    res.status(200).json({
        success: true,
        data: result,
    });
}));
/**
 * Get leaderboard
 * @route GET /api/education/leaderboard
 * @access Public
 */
exports.getLeaderboard = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const leaderboard = yield education_service_1.educationService.getLeaderboard();
    res.status(200).json({
        success: true,
        data: leaderboard,
    });
}));
/**
 * Create module (admin only)
 * @route POST /api/education/modules
 * @access Private (Admin only)
 */
exports.createModule = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Note: In a real implementation, you'd add admin-only validation here
    const { title, description, content, level, category, duration, points, quiz, } = req.body;
    if (!title || !description || !content || !category) {
        return next(new error_1.default('Please provide all required module details', 400));
    }
    const module = yield education_service_1.educationService.createModule({
        title,
        description,
        content,
        level: level || 'beginner',
        category,
        duration: duration || 15,
        points: points || 10,
        quiz: quiz || [],
    });
    res.status(201).json({
        success: true,
        message: 'Education module created successfully',
        data: module,
    });
}));
