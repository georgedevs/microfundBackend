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
exports.authService = exports.SupabaseAuthService = void 0;
const supabase_1 = __importDefault(require("@/config/supabase"));
const User_1 = __importDefault(require("@/models/User"));
const error_1 = __importDefault(require("@/utils/error"));
class SupabaseAuthService {
    /**
     * Register a new user with Supabase and create a MongoDB profile
     */
    registerUser(email, password, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate university email
            if (!this.isValidUniversityEmail(email)) {
                throw new error_1.default('Must use a valid university email address', 400);
            }
            // Sign up with Supabase
            const { data: authData, error: authError } = yield supabase_1.default.auth.signUp({
                email,
                password,
            });
            if (authError) {
                throw new error_1.default(authError.message, 400);
            }
            if (!authData.user) {
                throw new error_1.default('Failed to create user', 500);
            }
            // Create user profile in MongoDB
            const user = yield User_1.default.create({
                supabaseId: authData.user.id,
                email: authData.user.email,
                fullName: userData.fullName,
                institution: userData.institution,
                department: userData.department,
                level: userData.level,
            });
            return {
                user,
                session: authData.session,
            };
        });
    }
    /**
     * Login a user with Supabase and return MongoDB profile
     */
    loginUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // Sign in with Supabase
            const { data: authData, error: authError } = yield supabase_1.default.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) {
                throw new error_1.default('Invalid credentials', 401);
            }
            // Get user profile from MongoDB
            const user = yield User_1.default.findOne({ supabaseId: authData.user.id });
            if (!user) {
                throw new error_1.default('User profile not found', 404);
            }
            return {
                user,
                session: authData.session,
            };
        });
    }
    /**
     * Verify a JWT token
     */
    verifyToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.default.auth.getUser(token);
            if (error) {
                throw new error_1.default('Invalid or expired token', 401);
            }
            // Find user in MongoDB
            const user = yield User_1.default.findOne({ supabaseId: data.user.id });
            if (!user) {
                throw new error_1.default('User not found', 404);
            }
            return user;
        });
    }
    /**
     * Check if email is from a valid university domain
     */
    isValidUniversityEmail(email) {
        // Common university email domains
        const validDomains = [
            '.edu',
            '.edu.ng',
            '.ac.ng',
            'unilag.edu.ng',
            'ui.edu.ng',
            'unn.edu.ng',
            'oauife.edu.ng'
        ];
        return validDomains.some(domain => email.toLowerCase().endsWith(domain));
    }
}
exports.SupabaseAuthService = SupabaseAuthService;
// Export as singleton
exports.authService = new SupabaseAuthService();
