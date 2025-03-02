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
exports.getProductDetails = exports.deleteProduct = exports.updateProduct = exports.getBusinessProducts = exports.addProduct = void 0;
const catchAsyncError_1 = require("@/middleware/catchAsyncError");
const product_service_1 = require("@/services/business/product.service");
const error_1 = __importDefault(require("@/utils/error"));
/**
 * Add product to business
 * @route POST /api/business/:id/products
 * @access Private
 */
exports.addProduct = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, price, category, images, } = req.body;
    if (!name || !description || !price || !category) {
        return next(new error_1.default('Please provide all required product details', 400));
    }
    const product = yield product_service_1.productService.addProduct(userId, id, {
        name,
        description,
        price,
        category,
        images,
    });
    res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: product,
    });
}));
/**
 * Get business products
 * @route GET /api/business/:id/products
 * @access Public
 */
exports.getBusinessProducts = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield product_service_1.productService.getBusinessProducts(id, req.query);
    res.status(200).json({
        success: true,
        data: result,
    });
}));
/**
 * Update product
 * @route PUT /api/business/products/:id
 * @access Private
 */
exports.updateProduct = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const product = yield product_service_1.productService.updateProduct(userId, id, req.body);
    res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
    });
}));
/**
 * Delete product
 * @route DELETE /api/business/products/:id
 * @access Private
 */
exports.deleteProduct = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const result = yield product_service_1.productService.deleteProduct(userId, id);
    res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
    });
}));
/**
 * Get product details
 * @route GET /api/business/products/:id
 * @access Public
 */
exports.getProductDetails = (0, catchAsyncError_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield product_service_1.productService.getProductDetails(id);
    res.status(200).json({
        success: true,
        data: result,
    });
}));
