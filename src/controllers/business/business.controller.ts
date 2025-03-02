import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { businessService } from '@/services/business/business.service';
import AppError from '@/utils/error';

/**
 * Create a new business profile
 * @route POST /api/business
 * @access Private
 */
export const createBusiness = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const {
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
  } = req.body;
  
  const business = await businessService.createBusiness(userId, {
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
});

/**
 * Get all businesses
 * @route GET /api/business
 * @access Public
 */
export const getAllBusinesses = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const result = await businessService.getAllBusinesses(req.query);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get user's businesses
 * @route GET /api/business/my-businesses
 * @access Private
 */
export const getUserBusinesses = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const businesses = await businessService.getUserBusinesses(userId);
  
  res.status(200).json({
    success: true,
    data: businesses,
  });
});

/**
 * Get business details
 * @route GET /api/business/:id
 * @access Public
 */
export const getBusinessDetails = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { id } = req.params;
  
  const details = await businessService.getBusinessDetails(id);
  
  res.status(200).json({
    success: true,
    data: details,
  });
});

/**
 * Update business profile
 * @route PUT /api/business/:id
 * @access Private
 */
export const updateBusiness = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const updatedBusiness = await businessService.updateBusiness(userId, id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Business profile updated successfully',
    data: updatedBusiness,
  });
});

/**
 * Publish business
 * @route POST /api/business/:id/publish
 * @access Private
 */
export const publishBusiness = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const business = await businessService.publishBusiness(userId, id);
  
  res.status(200).json({
    success: true,
    message: 'Business published successfully',
    data: business,
  });
});

/**
 * Add business update
 * @route POST /api/business/:id/updates
 * @access Private
 */
export const addBusinessUpdate = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, content, images } = req.body;
  
  if (!title || !content) {
    return next(new AppError('Please provide title and content for the update', 400));
  }
  
  const update = await businessService.addBusinessUpdate(userId, id, {
    title,
    content,
    images,
  });
  
  res.status(201).json({
    success: true,
    message: 'Business update added successfully',
    data: update,
  });
});

/**
 * Invest in business
 * @route POST /api/business/:id/invest
 * @access Private
 */
export const investInBusiness = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { amount } = req.body;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return next(new AppError('Please provide a valid investment amount', 400));
  }
  
  const result = await businessService.investInBusiness(userId, id, amount);
  
  res.status(200).json({
    success: true,
    message: 'Investment successful',
    data: result,
  });
});

/**
 * Get user's investments
 * @route GET /api/business/investments
 * @access Private
 */
export const getUserInvestments = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const investments = await businessService.getUserInvestments(userId);
  
  res.status(200).json({
    success: true,
    data: investments,
  });
});

/**
 * Make repayment to investors
 * @route POST /api/business/:id/repay
 * @access Private
 */
export const makeRepayment = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { amount } = req.body;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return next(new AppError('Please provide a valid repayment amount', 400));
  }
  
  const result = await businessService.makeRepayment(userId, id, amount);
  
  res.status(200).json({
    success: true,
    message: 'Repayment successful',
    data: result,
  });
});