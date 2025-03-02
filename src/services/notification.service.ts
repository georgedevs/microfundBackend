// services/notification.service.ts
import Notification, { NotificationType } from '@/models/Notification';
import { Server } from 'socket.io';
import AppError from '@/utils/error';

let io: Server | null = null;

export class NotificationService {
  /**
   * Set Socket.io instance
   */
  setSocketIO(socketIO: Server) {
    io = socketIO;
  }

  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ) {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      isRead: false,
      metadata
    });

    // Emit to connected socket if available
    if (io) {
      io.to(userId).emit('notification', notification);
    }

    return notification;
  }

  /**
   * Create transaction notification
   */
  async createTransactionNotification(
    userId: string,
    title: string,
    message: string,
    transactionData: {
      type: string;
      amount: number;
      reference: string;
      description: string;
    }
  ) {
    return this.createNotification(
      userId,
      'transaction',
      title,
      message,
      transactionData
    );
  }

  /**
   * Create investment notification
   */
  async createInvestmentNotification(
    userId: string,
    title: string,
    message: string,
    investmentData: Record<string, any>
  ) {
    return this.createNotification(
      userId,
      'investment',
      title,
      message,
      investmentData
    );
  }

  /**
   * Create savings notification
   */
  async createSavingsNotification(
    userId: string,
    title: string,
    message: string,
    savingsData: Record<string, any>
  ) {
    return this.createNotification(
      userId,
      'savings',
      title,
      message,
      savingsData
    );
  }

  /**
   * Create education notification
   */
  async createEducationNotification(
    userId: string,
    title: string,
    message: string,
    educationData: Record<string, any>
  ) {
    return this.createNotification(
      userId,
      'education',
      title,
      message,
      educationData
    );
  }

  /**
   * Create marketplace notification
   */
  async createMarketplaceNotification(
    userId: string,
    title: string,
    message: string,
    marketplaceData: Record<string, any>
  ) {
    return this.createNotification(
      userId,
      'marketplace',
      title,
      message,
      marketplaceData
    );
  }

  /**
   * Create system notification
   */
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    systemData?: Record<string, any>
  ) {
    return this.createNotification(
      userId,
      'system',
      title,
      message,
      systemData
    );
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string) {
    const notifications = await Notification.find({ userId })
      .sort('-createdAt');

    return notifications;
  }

  /**
   * Get user's unread notifications
   */
  async getUnreadNotifications(userId: string) {
    const notifications = await Notification.find({
      userId,
      isRead: false
    }).sort('-createdAt');

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return { success: true };
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await notification.deleteOne();

    return { success: true };
  }
}

// Export as singleton
export const notificationService = new NotificationService();