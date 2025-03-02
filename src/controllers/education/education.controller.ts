import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { educationService } from '@/services/education/education.service';
import AppError from '@/utils/error';

/**
 * Get all education modules
 * @route GET /api/education/modules
 * @access Public
 */
export const getAllModules = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const result = await educationService.getAllModules(req.query);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get module details
 * @route GET /api/education/modules/:id
 * @access Public
 */
export const getModuleDetails = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  const result = await educationService.getModuleDetails(id, userId);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Submit quiz answers
 * @route POST /api/education/modules/:id/submit
 * @access Private
 */
export const submitQuiz = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { answers } = req.body;
  
  if (!answers || !Array.isArray(answers)) {
    return next(new AppError('Please provide answers as an array', 400));
  }
  
  const result = await educationService.submitQuiz(userId, id, answers);
  
  res.status(200).json({
    success: true,
    message: result.passed 
      ? 'Congratulations! You passed the quiz.' 
      : 'You did not pass the quiz. Try again!',
    data: result,
  });
});

/**
 * Get user's progress
 * @route GET /api/education/progress
 * @access Private
 */
export const getUserProgress = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const result = await educationService.getUserProgress(userId);
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get leaderboard
 * @route GET /api/education/leaderboard
 * @access Public
 */
export const getLeaderboard = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const leaderboard = await educationService.getLeaderboard();
  
  res.status(200).json({
    success: true,
    data: leaderboard,
  });
});

/**
 * Create module (admin only)
 * @route POST /api/education/modules
 * @access Private (Admin only)
 */
export const createModule = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Note: In a real implementation, you'd add admin-only validation here
  
  const {
    title,
    description,
    content,
    level,
    category,
    duration,
    points,
    quiz,
  } = req.body;
  
  if (!title || !description || !content || !category) {
    return next(new AppError('Please provide all required module details', 400));
  }
  
  const module = await educationService.createModule({
    title,
    description,
    content,
    level: level || 'beginner',
    category,
    duration: duration || 15,
    points: points || 10,
    quiz: quiz || [],
  });
  
  res.status(201).json({
    success: true,
    message: 'Education module created successfully',
    data: module,
  });
});