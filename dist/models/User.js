"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
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
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('User', UserSchema);
