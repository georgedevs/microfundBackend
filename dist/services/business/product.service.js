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
exports.productService = exports.ProductService = void 0;
const Product_1 = __importDefault(require("@/models/Product"));
const Business_1 = __importDefault(require("@/models/Business"));
const error_1 = __importDefault(require("@/utils/error"));
class ProductService {
    /**
     * Add a product to a business
     */
    addProduct(userId, businessId, productData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate product data
            if (!productData.name || !productData.description || !productData.price) {
                throw new error_1.default('Please provide all required product details', 400);
            }
            // Check if business exists and user is owner
            const business = yield Business_1.default.findById(businessId);
            if (!business) {
                throw new error_1.default('Business not found', 404);
            }
            if (business.owner.toString() !== userId) {
                throw new error_1.default('You are not authorized to add products to this business', 403);
            }
            // Create product
            const product = yield Product_1.default.create(Object.assign(Object.assign({ businessId }, productData), { inStock: true }));
            // Update business hasProducts flag
            if (!business.hasProducts) {
                business.hasProducts = true;
                yield business.save();
            }
            return product;
        });
    }
    /**
     * Get business products
     */
    getBusinessProducts(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, query = {}) {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 12;
            const skip = (page - 1) * limit;
            // Build filter
            const filter = { businessId };
            // Search by name or description
            if (query.search) {
                filter.$or = [
                    { name: { $regex: query.search, $options: 'i' } },
                    { description: { $regex: query.search, $options: 'i' } },
                ];
            }
            // Filter by category
            if (query.category) {
                filter.category = query.category;
            }
            // Filter by price range
            if (query.minPrice) {
                filter.price = Object.assign(Object.assign({}, filter.price), { $gte: Number(query.minPrice) });
            }
            if (query.maxPrice) {
                filter.price = Object.assign(Object.assign({}, filter.price), { $lte: Number(query.maxPrice) });
            }
            // Filter by availability
            if (query.inStock === 'true') {
                filter.inStock = true;
            }
            // Get products
            const products = yield Product_1.default.find(filter)
                .sort(query.sort || '-createdAt')
                .skip(skip)
                .limit(limit);
            // Get total count
            const total = yield Product_1.default.countDocuments(filter);
            // Get business details
            const business = yield Business_1.default.findById(businessId)
                .populate('owner', 'fullName email institution');
            return {
                business,
                products,
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
     * Update product
     */
    updateProduct(userId, productId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find product
            const product = yield Product_1.default.findById(productId);
            if (!product) {
                throw new error_1.default('Product not found', 404);
            }
            // Check if user is business owner
            const business = yield Business_1.default.findById(product.businessId);
            if (!business || business.owner.toString() !== userId) {
                throw new error_1.default('You are not authorized to update this product', 403);
            }
            // Update product
            const updatedProduct = yield Product_1.default.findByIdAndUpdate(productId, updateData, { new: true, runValidators: true });
            return updatedProduct;
        });
    }
    /**
     * Delete product
     */
    deleteProduct(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find product
            const product = yield Product_1.default.findById(productId);
            if (!product) {
                throw new error_1.default('Product not found', 404);
            }
            // Check if user is business owner
            const business = yield Business_1.default.findById(product.businessId);
            if (!business || business.owner.toString() !== userId) {
                throw new error_1.default('You are not authorized to delete this product', 403);
            }
            // Delete product
            yield product.deleteOne();
            // Check if business has other products
            const remainingProducts = yield Product_1.default.countDocuments({ businessId: business._id });
            if (remainingProducts === 0) {
                business.hasProducts = false;
                yield business.save();
            }
            return { success: true };
        });
    }
    /**
     * Get product details
     */
    getProductDetails(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield Product_1.default.findById(productId);
            if (!product) {
                throw new error_1.default('Product not found', 404);
            }
            // Get business details
            const business = yield Business_1.default.findById(product.businessId)
                .populate('owner', 'fullName email institution department');
            if (!business) {
                throw new error_1.default('Business not found', 404);
            }
            // Get related products
            const relatedProducts = yield Product_1.default.find({
                businessId: product.businessId,
                _id: { $ne: productId },
                category: product.category,
            }).limit(4);
            return {
                product,
                business,
                relatedProducts,
            };
        });
    }
}
exports.ProductService = ProductService;
// Export as singleton
exports.productService = new ProductService();
