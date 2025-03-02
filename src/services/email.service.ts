// services/email.service.ts
import nodemailer from 'nodemailer';
import User from '@/models/User';
import AppError from '@/utils/error';

export class EmailService {
  private transporter: nodemailer.Transporter | undefined;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'support@microfund.com';
  
    // Create a transporter (for development, use Ethereal; for production, use a real service)
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        // Add timeouts to prevent hanging
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });
    } else {
      // For development, use Ethereal (https://ethereal.email/)
      nodemailer.createTestAccount().then((account) => {
        this.transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
          connectionTimeout: 10000,
          socketTimeout: 10000,
        });
        console.log('Ethereal email account created for testing: ', account.user);
      }).catch(error => {
        console.error('Failed to create test email account:', error);
      });
    }
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: nodemailer.Attachment[]
  ) {
    try {
      const info = await this.transporter.sendMail({
        from: `"MicroFund" <${this.fromEmail}>`,
        to,
        subject,
        html,
        attachments,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new AppError('Failed to send email', 500);
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const subject = 'Welcome to MicroFund - Your Financial Inclusion Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5E72E4; padding: 20px; text-align: center; color: white;">
          <h1>Welcome to MicroFund</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${user.fullName},</p>
          <p>Welcome to MicroFund, your comprehensive financial inclusion platform for university students!</p>
          <p>With MicroFund, you can:</p>
          <ul>
            <li>Invest in student businesses and earn returns</li>
            <li>Join savings groups with your peers</li>
            <li>Buy and sell products in our marketplace</li>
            <li>Learn financial literacy with our educational modules</li>
          </ul>
          <p>Get started by <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="color: #5E72E4;">setting up your profile</a> and exploring the platform.</p>
          <p>If you have any questions, simply reply to this email.</p>
          <p>Best regards,<br>The MicroFund Team</p>
        </div>
        <div style="background-color: #f2f2f2; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; ${new Date().getFullYear()} MicroFund. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send transaction receipt
   */
  async sendTransactionReceipt(
    userId: string,
    transactionData: {
      type: string;
      amount: number;
      description: string;
      reference: string;
      status: string;
      createdAt: Date;
    }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const transactionType = transactionData.type.replace('_', ' ');
    const formattedAmount = new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN' 
    }).format(transactionData.amount);

    const formattedDate = new Date(transactionData.createdAt).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = `MicroFund Receipt - ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5E72E4; padding: 20px; text-align: center; color: white;">
          <h1>Transaction Receipt</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${user.fullName},</p>
          <p>Here is your receipt for a recent transaction on MicroFund:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #5E72E4;">
            <p><strong>Transaction Type:</strong> ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}</p>
            <p><strong>Amount:</strong> ${formattedAmount}</p>
            <p><strong>Description:</strong> ${transactionData.description}</p>
            <p><strong>Reference:</strong> ${transactionData.reference}</p>
            <p><strong>Status:</strong> ${transactionData.status.charAt(0).toUpperCase() + transactionData.status.slice(1)}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
          </div>
          
          <p>You can view your complete transaction history in your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/transactions" style="color: #5E72E4;">MicroFund dashboard</a>.</p>
          <p>If you have any questions about this transaction, please contact our support team.</p>
          <p>Thank you for using MicroFund!</p>
          <p>Best regards,<br>The MicroFund Team</p>
        </div>
        <div style="background-color: #f2f2f2; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; ${new Date().getFullYear()} MicroFund. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  
  /**
   * Send investment opportunity alert
   */
  async sendInvestmentOpportunityAlert(
    userId: string,
    businessData: {
      id: string;
      name: string;
      description: string;
      fundingGoal: number;
      raisedAmount: number;
      expectedReturnRate: number;
      duration: number;
    }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const subject = `New Investment Opportunity on MicroFund - ${businessData.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5E72E4; padding: 20px; text-align: center; color: white;">
          <h1>New Investment Opportunity</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${user.fullName},</p>
          <p>We've found a new investment opportunity that might interest you!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #5E72E4;">
            <h2 style="margin-top: 0; color: #333;">${businessData.name}</h2>
            <p>${businessData.description.substring(0, 150)}${businessData.description.length > 150 ? '...' : ''}</p>
            <p><strong>Funding Goal:</strong> ₦${businessData.fundingGoal.toLocaleString()}</p>
            <p><strong>Already Raised:</strong> ₦${businessData.raisedAmount.toLocaleString()} (${Math.round((businessData.raisedAmount / businessData.fundingGoal) * 100)}%)</p>
            <p><strong>Expected Return:</strong> ${businessData.expectedReturnRate}% over ${businessData.duration} months</p>
          </div>
          
          <p>Don't miss this opportunity to invest and earn returns while supporting other students!</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/business/${businessData.id}" style="display: inline-block; background-color: #5E72E4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Opportunity</a></p>
          <p>Happy investing!</p>
          <p>Best regards,<br>The MicroFund Team</p>
        </div>
        <div style="background-color: #f2f2f2; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; ${new Date().getFullYear()} MicroFund. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send savings group reminder
   */
  async sendSavingsGroupReminder(
    userId: string,
    groupData: {
      id: string;
      name: string;
      contributionAmount: number;
      dueDate: Date;
    }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const formattedAmount = new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN' 
    }).format(groupData.contributionAmount);

    const formattedDate = new Date(groupData.dueDate).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Reminder: Contribution Due for ${groupData.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5E72E4; padding: 20px; text-align: center; color: white;">
          <h1>Savings Contribution Reminder</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${user.fullName},</p>
          <p>This is a friendly reminder that your contribution to the <strong>${groupData.name}</strong> savings group is due soon.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #5E72E4;">
            <p><strong>Amount Due:</strong> ${formattedAmount}</p>
            <p><strong>Due Date:</strong> ${formattedDate}</p>
          </div>
          
          <p>Don't miss your contribution! Regular savings help you reach your financial goals.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/savings/groups/${groupData.id}" style="display: inline-block; background-color: #5E72E4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Make Contribution Now</a></p>
          <p>Thank you for being part of our savings community!</p>
          <p>Best regards,<br>The MicroFund Team</p>
        </div>
        <div style="background-color: #f2f2f2; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; ${new Date().getFullYear()} MicroFund. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send educational achievement certificate
   */
  async sendEducationalAchievementCertificate(
    userId: string,
    achievementData: {
      title: string;
      description: string;
      score: number;
      completionDate: Date;
      module: {
        id: string;
        title: string;
        level: string;
      };
    }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const formattedDate = new Date(achievementData.completionDate).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Certificate of Completion - ${achievementData.module.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #5E72E4; padding: 20px; text-align: center; color: white;">
          <h1>Certificate of Achievement</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none; background-color: #f9f9f9;">
          <div style="border: 2px solid #5E72E4; padding: 20px; text-align: center; background-color: white;">
            <h2 style="color: #333; margin-top: 0;">Certificate of Completion</h2>
            <p style="font-size: 18px;">This certifies that</p>
            <p style="font-size: 24px; font-weight: bold; color: #5E72E4; margin: 10px 0;">${user.fullName}</p>
            <p style="font-size: 18px;">has successfully completed</p>
            <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">${achievementData.module.title}</p>
            <p style="font-size: 16px;">${achievementData.module.level.charAt(0).toUpperCase() + achievementData.module.level.slice(1)} Level</p>
            <p style="font-size: 16px;">with a score of <strong>${achievementData.score}%</strong></p>
            <p style="font-size: 16px; margin-top: 20px;">Completed on ${formattedDate}</p>
            <div style="margin-top: 30px;">
              <img src="https://via.placeholder.com/200x50.png?text=MicroFund+Signature" alt="MicroFund Signature" />
              <p style="margin-top: 10px; font-weight: bold;">MicroFund Education Team</p>
            </div>
          </div>
          
          <p style="margin-top: 20px;">Congratulations on your achievement! Continue your financial education journey with more modules on MicroFund.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/education" style="display: inline-block; background-color: #5E72E4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Explore More Modules</a></p>
          <p>Best regards,<br>The MicroFund Team</p>
        </div>
        <div style="background-color: #f2f2f2; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; ${new Date().getFullYear()} MicroFund. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

// Export as singleton
export const emailService = new EmailService();