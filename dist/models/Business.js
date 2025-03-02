"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const BusinessSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Business description is required'],
    },
    category: {
        type: String,
        enum: [
            'technology',
            'food',
            'fashion',
            'education',
            'health',
            'transportation',
            'entertainment',
            'services',
            'retail',
            'other'
        ],
        required: [true, 'Business category is required'],
    },
    profileImage: {
        type: String,
    },
    coverImage: {
        type: String,
    },
    fundingGoal: {
        type: Number,
        required: [true, 'Funding goal is required'],
        min: 0,
    },
    raisedAmount: {
        type: Number,
        default: 0,
    },
    expectedReturnRate: {
        type: Number,
        required: [true, 'Expected return rate is required'],
        min: 0,
        max: 100,
    },
    duration: {
        type: Number,
        required: [true, 'Investment duration is required'],
        min: 1,
    },
    hasProducts: {
        type: Boolean,
        default: false,
    },
    location: {
        type: String,
        required: [true, 'Business location is required'],
    },
    contactEmail: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    contactPhone: {
        type: String,
    },
    socialLinks: {
        website: String,
        instagram: String,
        twitter: String,
        facebook: String,
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'funded', 'completed', 'inactive'],
        default: 'draft',
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('Business', BusinessSchema);
