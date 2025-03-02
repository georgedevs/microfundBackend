// controllers/notification.controller.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from '@/middleware/catchAsyncError';
import { notificationService } from '@/services/notification.service';
import AppError from '@/utils/error';

/**
 * Get user's notifications
 * @route GET /api/notifications
 * @access Private
 */
export const getUserNotifications = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const notifications = await notificationService.getUserNotifications(userId);
  
  res.status(200).json({
    success: true,
    data: notifications
  });
});

/**
 * Get user's unread notifications
 * @route GET /api/notifications/unread
 * @access Private
 */
export const getUnreadNotifications = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const notifications = await notificationService.getUnreadNotifications(userId);
  
  res.status(200).json({
    success: true,
    data: notifications
  });
});

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id/read
 * @access Private
 */
export const markAsRead = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const notification = await notificationService.markAsRead(userId, id);
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 * @access Private
 */
export const markAllAsRead = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  
  const result = await notificationService.markAllAsRead(userId);
  
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
export const deleteNotification = catchAsyncError(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const result = await notificationService.deleteNotification(userId, id);
  
  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});