import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/error';
import supabase from '../config/supabase';
import User from '../models/User';
import { catchAsyncError } from '@/middleware/catchAsyncError';

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      supabaseUser?: any;
    }
  }
}

export const protect = catchAsyncError(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1) Get token from header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    // 2) Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    // 3) Check if user still exists in Supabase
    const supabaseUser = data.user;
    
    if (!supabaseUser) {
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    // 4) Get the user from MongoDB
    const user = await User.findOne({ supabaseId: supabaseUser.id });
    
    if (!user) {
      return next(new AppError('User profile not found', 404));
    }

    // 5) Grant access to protected route with MongoDB user data
    req.user = user;
    req.supabaseUser = supabaseUser; // Optional: keep Supabase user data if needed
    
    next();
  } catch (err) {
    return next(new AppError('Not authorized to access this route', 401));
  }
});