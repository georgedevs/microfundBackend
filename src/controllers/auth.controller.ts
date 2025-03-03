import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncError';
import AppError from '../utils/error';
import { authService } from '@/services/supabase.service';
import supabase from '@/config/supabase';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { 
    email, 
    password, 
    fullName, 
    institution, 
    department, 
    level 
  } = req.body;

  // Check if all required fields are present
  if (!email || !password || !fullName || !institution || !department || !level) {
    return next(new AppError('Please provide all required fields', 400));
  }

  // Register the user
  const result = await authService.registerUser(
    email, 
    password, 
    {
      fullName,
      institution,
      department,
      level
    }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: result.user._id,
        fullName: result.user.fullName,
        email: result.user.email,
        institution: result.user.institution
      },
      token: result.session?.access_token,
      refreshToken: result.session?.refresh_token 
    }
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Login the user
  const result = await authService.loginUser(email, password);

  res.status(200).json({
    success: true,
    message: 'User logged in successfully',
    data: {
      user: {
        id: result.user._id,
        fullName: result.user.fullName,
        email: result.user.email,
        institution: result.user.institution,
        walletBalance: result.user.walletBalance
      },
      token: result.session?.access_token,
      refreshToken: result.session?.refresh_token 
    }
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

/**
* Logout user
* @route POST /api/auth/logout
* @access Private
*/
export const logout = catchAsyncError(async (
 req: Request, 
 res: Response, 
 next: NextFunction
) => {
 const { error } = await supabase.auth.signOut();
 
 if (error) {
   return next(new AppError('Error logging out', 500));
 }

 res.status(200).json({
   success: true,
   message: 'User logged out successfully'
 });
});