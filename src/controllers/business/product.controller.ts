import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { productService } from '@/services/business/product.service';
import AppError from '@/utils/error';

/**
 * Add product to business
 * @route POST /api/business/:id/products
 * @access Private
 */
export const addProduct = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  const {
    name,
    description,
    price,
    category,
    images,
  } = req.body;
  
  if (!name || !description || !price || !category) {
    return next(new AppError('Please provide all required product details', 400));
  }
  
  const product = await productService.addProduct(userId, id, {
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
});

/**
 * Get business products
 * @route GET /api/business/:id/products
 * @access Public
 */
export const getBusinessProducts = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { id } = req.params;
  
  const result = await productService.getBusinessProducts(id, req.query);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Update product
 * @route PUT /api/business/products/:id
 * @access Private
 */
export const updateProduct = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const product = await productService.updateProduct(userId, id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

/**
 * Delete product
 * @route DELETE /api/business/products/:id
 * @access Private
 */
export const deleteProduct = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const result = await productService.deleteProduct(userId, id);
  
  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

/**
 * Get product details
 * @route GET /api/business/products/:id
 * @access Public
 */
export const getProductDetails = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { id } = req.params;
  
  const result = await productService.getProductDetails(id);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});