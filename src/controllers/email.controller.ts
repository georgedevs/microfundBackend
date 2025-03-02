// controllers/email.controller.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { emailService } from '@/services/email.service';
import AppError from '@/utils/error';

/**
 * Send test email (development only)
 * @route POST /api/email/test
 * @access Private/Admin
 */
export const sendTestEmail = catchAsyncError(async (req, res, next) => {
  // Only available in development
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('This endpoint is not available in production', 404));
  }

  const userId = req.user.id;
  const { type } = req.body;
  
  if (!type) {
    return next(new AppError('Email type is required', 400));
  }

  // Set a reasonable timeout for email sending
  const sendEmailPromise = new Promise(async (resolve, reject) => {
    try {
      let result;
      switch (type) {
        case 'welcome':
          result = await emailService.sendWelcomeEmail(userId);
          break;
        // ... other cases
        default:
          return reject(new AppError('Invalid email type', 400));
      }
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
  
  try {
    // Apply a 5-second timeout
    const result = await Promise.race([
      sendEmailPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new AppError('Email sending timed out', 408)), 5000)
      )
    ]);
    
    res.status(200).json({
      success: true,
      message: `Test ${type} email sent successfully`,
      data: result
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return next(new AppError(`Failed to send ${type} email: ${error.message}`, 500));
  }
});