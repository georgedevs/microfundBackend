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
export const sendTestEmail = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Only available in development
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('This endpoint is not available in production', 404));
  }

  const userId = req.user.id;
  const { type } = req.body;
  
  if (!type) {
    return next(new AppError('Email type is required', 400));
  }

  // For mock environment, return a success response without actually sending an email
  if (process.env.USE_MOCK_PAYMENT === 'true') {
    return res.status(200).json({
      success: true,
      message: `Test ${type} email simulation successful`,
      data: {
        messageId: `mock-email-${Date.now()}`,
        success: true
      }
    });
  }

  let result;
  
  try {
    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(userId);
        break;
      case 'transaction':
        result = await emailService.sendTransactionReceipt(userId, {
          type: 'deposit',
          amount: 10000,
          description: 'Wallet deposit',
          reference: 'TEST-REF-' + Date.now(),
          status: 'completed',
          createdAt: new Date()
        });
        break;
      case 'investment':
        result = await emailService.sendInvestmentOpportunityAlert(userId, {
          id: '123456789',
          name: 'Test Business',
          description: 'This is a test business for email template demonstration. This business focuses on innovative solutions for students.',
          fundingGoal: 100000,
          raisedAmount: 25000,
          expectedReturnRate: 15,
          duration: 6
        });
        break;
      case 'savings':
        result = await emailService.sendSavingsGroupReminder(userId, {
          id: '123456789',
          name: 'Test Savings Group',
          contributionAmount: 5000,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        });
        break;
      case 'education':
        result = await emailService.sendEducationalAchievementCertificate(userId, {
          title: 'Financial Literacy Master',
          description: 'Completed advanced financial literacy module',
          score: 95,
          completionDate: new Date(),
          module: {
            id: '123456789',
            title: 'Understanding Investment Basics',
            level: 'intermediate'
          }
        });
        break;
      default:
        return next(new AppError('Invalid email type', 400));
    }
    
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