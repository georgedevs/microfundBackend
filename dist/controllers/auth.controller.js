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
exports.logout = exports.getMe = exports.login = exports.register = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const error_1 = __importDefault(require("../utils/error"));
const supabase_service_1 = require("@/services/supabase.service");
const supabase_1 = __importDefault(require("@/config/supabase"));
/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email, password, fullName, institution, department, level } = req.body;
    // Check if all required fields are present
    if (!email || !password || !fullName || !institution || !department || !level) {
        return next(new error_1.default('Please provide all required fields', 400));
    }
    // Register the user
    const result = yield supabase_service_1.authService.registerUser(email, password, {
        fullName,
        institution,
        department,
        level
    });
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: result.user._id,
                fullName: result.user.fullName,
                email: result.user.email,
                institution: result.user.institution
            },
            token: (_a = result.session) === null || _a === void 0 ? void 0 : _a.access_token,
            refreshToken: (_b = result.session) === null || _b === void 0 ? void 0 : _b.refresh_token
        }
    });
}));
/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email, password } = req.body;
    // Check if email and password exist
    if (!email || !password) {
        return next(new error_1.default('Please provide email and password', 400));
    }
    // Login the user
    const result = yield supabase_service_1.authService.loginUser(email, password);
    res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: {
            user: {
                id: result.user._id,
                fullName: result.user.fullName,
                email: result.user.email,
                institution: result.user.institution,
                walletBalance: result.user.walletBalance
            },
            token: (_a = result.session) === null || _a === void 0 ? void 0 : _a.access_token,
            refreshToken: (_b = result.session) === null || _b === void 0 ? void 0 : _b.refresh_token
        }
    });
}));
/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        success: true,
        data: {
            user: req.user
        }
    });
}));
/**
* Logout user
* @route POST /api/auth/logout
* @access Private
*/
exports.logout = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = yield supabase_1.default.auth.signOut();
    if (error) {
        return next(new error_1.default('Error logging out', 500));
    }
    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    });
}));
