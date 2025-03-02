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
exports.makeRepayment = exports.getUserInvestments = exports.investInBusiness = exports.addBusinessUpdate = exports.publishBusiness = exports.updateBusiness = exports.getBusinessDetails = exports.getUserBusinesses = exports.getAllBusinesses = exports.createBusiness = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const business_service_1 = require("@/services/business/business.service");
const error_1 = __importDefault(require("@/utils/error"));
/**
 * Create a new business profile
 * @route POST /api/business
 * @access Private
 */
exports.createBusiness = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { name, description, category, fundingGoal, expectedReturnRate, duration, location, contactEmail, contactPhone, socialLinks, } = req.body;
    const business = yield business_service_1.businessService.createBusiness(userId, {
        name,
        description,
        category,
        fundingGoal,
        expectedReturnRate,
        duration,
        location,
        contactEmail,
        contactPhone,
        socialLinks,
    });
    res.status(201).json({
        success: true,
        message: 'Business profile created successfully',
        data: business,
    });
}));
/**
 * Get all businesses
 * @route GET /api/business
 * @access Public
 */
exports.getAllBusinesses = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield business_service_1.businessService.getAllBusinesses(req.query);
    res.status(200).json({
        success: true,
        data: result,
    });
}));
/**
 * Get user's businesses
 * @route GET /api/business/my-businesses
 * @access Private
 */
exports.getUserBusinesses = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const businesses = yield business_service_1.businessService.getUserBusinesses(userId);
    res.status(200).json({
        success: true,
        data: businesses,
    });
}));
/**
 * Get business details
 * @route GET /api/business/:id
 * @access Public
 */
exports.getBusinessDetails = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const details = yield business_service_1.businessService.getBusinessDetails(id);
    res.status(200).json({
        success: true,
        data: details,
    });
}));
/**
 * Update business profile
 * @route PUT /api/business/:id
 * @access Private
 */
exports.updateBusiness = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const updatedBusiness = yield business_service_1.businessService.updateBusiness(userId, id, req.body);
    res.status(200).json({
        success: true,
        message: 'Business profile updated successfully',
        data: updatedBusiness,
    });
}));
/**
 * Publish business
 * @route POST /api/business/:id/publish
 * @access Private
 */
exports.publishBusiness = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const business = yield business_service_1.businessService.publishBusiness(userId, id);
    res.status(200).json({
        success: true,
        message: 'Business published successfully',
        data: business,
    });
}));
/**
 * Add business update
 * @route POST /api/business/:id/updates
 * @access Private
 */
exports.addBusinessUpdate = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, content, images } = req.body;
    if (!title || !content) {
        return next(new error_1.default('Please provide title and content for the update', 400));
    }
    const update = yield business_service_1.businessService.addBusinessUpdate(userId, id, {
        title,
        content,
        images,
    });
    res.status(201).json({
        success: true,
        message: 'Business update added successfully',
        data: update,
    });
}));
/**
 * Invest in business
 * @route POST /api/business/:id/invest
 * @access Private
 */
exports.investInBusiness = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
        return next(new error_1.default('Please provide a valid investment amount', 400));
    }
    const result = yield business_service_1.businessService.investInBusiness(userId, id, amount);
    res.status(200).json({
        success: true,
        message: 'Investment successful',
        data: result,
    });
}));
/**
 * Get user's investments
 * @route GET /api/business/investments
 * @access Private
 */
exports.getUserInvestments = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const investments = yield business_service_1.businessService.getUserInvestments(userId);
    res.status(200).json({
        success: true,
        data: investments,
    });
}));
/**
 * Make repayment to investors
 * @route POST /api/business/:id/repay
 * @access Private
 */
exports.makeRepayment = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
        return next(new error_1.default('Please provide a valid repayment amount', 400));
    }
    const result = yield business_service_1.businessService.makeRepayment(userId, id, amount);
    res.status(200).json({
        success: true,
        message: 'Repayment successful',
        data: result,
    });
}));
