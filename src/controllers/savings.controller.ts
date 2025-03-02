import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { savingsService } from '@/services/savings/savings.service';
import AppError from '@/utils/error';

/**
 * Create a new savings group
 * @route POST /api/savings/groups
 * @access Private
 */
export const createGroup = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const {
    name,
    description,
    targetAmount,
    contributionAmount,
    frequency,
    startDate,
    endDate,
  } = req.body;
  
  // Validate required fields
  if (!name || !description || !targetAmount || !contributionAmount || !startDate || !endDate) {
    return next(new AppError('Please provide all required fields', 400));
  }
  
  const group = await savingsService.createGroup(userId, {
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
});

/**
 * Get all savings groups
 * @route GET /api/savings/groups
 * @access Private
 */
export const getAllGroups = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const result = await savingsService.getAllGroups(req.query);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get user's groups
 * @route GET /api/savings/my-groups
 * @access Private
 */
export const getUserGroups = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const groups = await savingsService.getUserGroups(userId);
  
  res.status(200).json({
    success: true,
    data: groups,
  });
});

/**
 * Get group details
 * @route GET /api/savings/groups/:id
 * @access Private
 */
export const getGroupDetails = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { id } = req.params;
  
  const details = await savingsService.getGroupDetails(id);
  
  res.status(200).json({
    success: true,
    data: details,
  });
});

/**
 * Join a savings group
 * @route POST /api/savings/groups/:id/join
 * @access Private
 */
export const joinGroup = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const member = await savingsService.joinGroup(userId, id);
  
  res.status(200).json({
    success: true,
    message: 'Successfully joined the savings group',
    data: member,
  });
});

/**
 * Make a contribution to a group
 * @route POST /api/savings/groups/:id/contribute
 * @access Private
 */
export const makeContribution = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { amount } = req.body;
  
  const result = await savingsService.makeContribution(userId, id, amount);
  
  res.status(200).json({
    success: true,
    message: 'Contribution made successfully',
    data: result,
  });
});

/**
 * Leave a savings group
 * @route POST /api/savings/groups/:id/leave
 * @access Private
 */
export const leaveGroup = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const result = await savingsService.leaveGroup(userId, id);
  
  res.status(200).json({
    success: true,
    message: 'Successfully left the savings group',
    data: result,
  });
});

/**
 * Get user's contributions for a group
 * @route GET /api/savings/groups/:id/contributions
 * @access Private
 */
export const getUserContributions = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const contributions = await savingsService.getUserContributions(userId, id);
  
  res.status(200).json({
    success: true,
    data: contributions,
  });
});