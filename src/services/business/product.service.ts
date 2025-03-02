import Product from '@/models/Product';
import Business from '@/models/Business';
import AppError from '@/utils/error';

export class ProductService {
  /**
   * Add a product to a business
   */
  async addProduct(
    userId: string,
    businessId: string,
    productData: {
      name: string;
      description: string;
      price: number;
      category: string;
      images?: string[];
    }
  ) {
    // Validate product data
    if (!productData.name || !productData.description || !productData.price) {
      throw new AppError('Please provide all required product details', 400);
    }

    // Check if business exists and user is owner
    const business = await Business.findById(businessId);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    if (business.owner.toString() !== userId) {
      throw new AppError('You are not authorized to add products to this business', 403);
    }

    // Create product
    const product = await Product.create({
      businessId,
      ...productData,
      inStock: true,
    });

    // Update business hasProducts flag
    if (!business.hasProducts) {
      business.hasProducts = true;
      await business.save();
    }

    return product;
  }

  /**
   * Get business products
   */
  async getBusinessProducts(businessId: string, query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { businessId };

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
      filter.price = { ...filter.price, $gte: Number(query.minPrice) };
    }

    if (query.maxPrice) {
      filter.price = { ...filter.price, $lte: Number(query.maxPrice) };
    }

    // Filter by availability
    if (query.inStock === 'true') {
      filter.inStock = true;
    }

    // Get products
    const products = await Product.find(filter)
      .sort(query.sort || '-createdAt')
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Product.countDocuments(filter);

    // Get business details
    const business = await Business.findById(businessId)
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
  }

 /**
 * Update product
 */
async updateProduct(
  userId: string,
  productId: string,
  updateData: Partial<{
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    inStock: boolean;
  }>
) {
  try {
    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if user is business owner
    const business = await Business.findById(product.businessId);

    if (!business || business.owner.toString() !== userId) {
      throw new AppError('You are not authorized to update this product', 403);
    }

    // Update product with timeout protection
    const updatedProduct = await Promise.race([
      Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timed out')), 5000)
      )
    ]);

    return updatedProduct;
  } catch (error) {
    if (error.message === 'Database operation timed out') {
      throw new AppError('Update operation timed out, please try again', 408);
    }
    throw error;
  }
}

  /**
   * Delete product
   */
  async deleteProduct(userId: string, productId: string) {
    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if user is business owner
    const business = await Business.findById(product.businessId);

    if (!business || business.owner.toString() !== userId) {
      throw new AppError('You are not authorized to delete this product', 403);
    }

    // Delete product
    await product.deleteOne();

    // Check if business has other products
    const remainingProducts = await Product.countDocuments({ businessId: business._id });

    if (remainingProducts === 0) {
      business.hasProducts = false;
      await business.save();
    }

    return { success: true };
  }

  /**
   * Get product details
   */
  async getProductDetails(productId: string) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Get business details
    const business = await Business.findById(product.businessId)
      .populate('owner', 'fullName email institution department');

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    // Get related products
    const relatedProducts = await Product.find({
      businessId: product.businessId,
      _id: { $ne: productId },
      category: product.category,
    }).limit(4);

    return {
      product,
      business,
      relatedProducts,
    };
  }
}

// Export as singleton
export const productService = new ProductService();