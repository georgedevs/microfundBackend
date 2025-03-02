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
exports.protect = void 0;
const error_1 = __importDefault(require("../utils/error"));
const supabase_1 = __importDefault(require("../config/supabase"));
const User_1 = __importDefault(require("../models/User"));
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
exports.protect = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // 1) Get token from header
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new error_1.default('Not authorized to access this route', 401));
    }
    try {
        // 2) Verify token with Supabase
        const { data, error } = yield supabase_1.default.auth.getUser(token);
        if (error) {
            return next(new error_1.default('Not authorized to access this route', 401));
        }
        // 3) Check if user still exists in Supabase
        const supabaseUser = data.user;
        if (!supabaseUser) {
            return next(new error_1.default('User belonging to this token no longer exists', 401));
        }
        // 4) Get the user from MongoDB
        const user = yield User_1.default.findOne({ supabaseId: supabaseUser.id });
        if (!user) {
            return next(new error_1.default('User profile not found', 404));
        }
        // 5) Grant access to protected route with MongoDB user data
        req.user = user;
        req.supabaseUser = supabaseUser; // Optional: keep Supabase user data if needed
        next();
    }
    catch (err) {
        return next(new error_1.default('Not authorized to access this route', 401));
    }
}));
