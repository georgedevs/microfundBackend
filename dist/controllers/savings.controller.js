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
exports.getUserContributions = exports.leaveGroup = exports.makeContribution = exports.joinGroup = exports.getGroupDetails = exports.getUserGroups = exports.getAllGroups = exports.createGroup = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const savings_service_1 = require("@/services/savings/savings.service");
const error_1 = __importDefault(require("@/utils/error"));
/**
 * Create a new savings group
 * @route POST /api/savings/groups
 * @access Private
 */
exports.createGroup = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { name, description, targetAmount, contributionAmount, frequency, startDate, endDate, } = req.body;
    // Validate required fields
    if (!name || !description || !targetAmount || !contributionAmount || !startDate || !endDate) {
        return next(new error_1.default('Please provide all required fields', 400));
    }
    const group = yield savings_service_1.savingsService.createGroup(userId, {
        name,
        description,
        targetAmount,
        contributionAmount,
        frequency: frequency || 'weekly',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
    });
    res.status(201).json({
        success: true,
        message: 'Savings group created successfully',
        data: group,
    });
}));
/**
 * Get all savings groups
 * @route GET /api/savings/groups
 * @access Private
 */
exports.getAllGroups = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield savings_service_1.savingsService.getAllGroups(req.query);
    res.status(200).json({
        success: true,
        data: result,
    });
}));
/**
 * Get user's groups
 * @route GET /api/savings/my-groups
 * @access Private
 */
exports.getUserGroups = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const groups = yield savings_service_1.savingsService.getUserGroups(userId);
    res.status(200).json({
        success: true,
        data: groups,
    });
}));
/**
 * Get group details
 * @route GET /api/savings/groups/:id
 * @access Private
 */
exports.getGroupDetails = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const details = yield savings_service_1.savingsService.getGroupDetails(id);
    res.status(200).json({
        success: true,
        data: details,
    });
}));
/**
 * Join a savings group
 * @route POST /api/savings/groups/:id/join
 * @access Private
 */
exports.joinGroup = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const member = yield savings_service_1.savingsService.joinGroup(userId, id);
    res.status(200).json({
        success: true,
        message: 'Successfully joined the savings group',
        data: member,
    });
}));
/**
 * Make a contribution to a group
 * @route POST /api/savings/groups/:id/contribute
 * @access Private
 */
exports.makeContribution = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount } = req.body;
    const result = yield savings_service_1.savingsService.makeContribution(userId, id, amount);
    res.status(200).json({
        success: true,
        message: 'Contribution made successfully',
        data: result,
    });
}));
/**
 * Leave a savings group
 * @route POST /api/savings/groups/:id/leave
 * @access Private
 */
exports.leaveGroup = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const result = yield savings_service_1.savingsService.leaveGroup(userId, id);
    res.status(200).json({
        success: true,
        message: 'Successfully left the savings group',
        data: result,
    });
}));
/**
 * Get user's contributions for a group
 * @route GET /api/savings/groups/:id/contributions
 * @access Private
 */
exports.getUserContributions = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const contributions = yield savings_service_1.savingsService.getUserContributions(userId, id);
    res.status(200).json({
        success: true,
        data: contributions,
    });
}));
