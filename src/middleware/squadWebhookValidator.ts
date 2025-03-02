import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import AppError from '@/utils/error';

/**
 * Middleware to validate Squad webhook signatures
 */
export const squadWebhookValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
const signature = req.headers['x-squad-encrypted-body'] as string;
    
    // Check if signature is present
    if (!signature) {
      console.warn('Missing x-squad-encrypted-body in webhook request');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing signature' 
      });
    }

    // Get secret key from environment
    const secretKey = process.env.SQUAD_SECRET_KEY;
 
    if (!secretKey) {
      console.error('Squad secret key not configured');
      return res.status(500).json({ 
        success: false, 
        message: 'Configuration error' 
      });
    }

    // Calculate HMAC SHA512 hash of the request body
    const hmac = crypto.createHmac('sha512', secretKey);
    const computedSignature = hmac.update(JSON.stringify(req.body)).digest('hex');

    // Compare signatures (case-insensitive)
    if (computedSignature.toLowerCase() !== signature.toLowerCase()) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }

    // If signature is valid, proceed
    next();
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error validating webhook' 
    });
  }
};

/**
 * Alternative method for webhooks using encrypted_body
 * This is retained for backwards compatibility
 */
export const squadEncryptedBodyValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const encryptedBody = req.body.encrypted_body;
    
    // Check if encrypted_body is present
    if (!encryptedBody) {
      console.warn('Missing encrypted_body in webhook payload');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing encrypted body' 
      });
    }

    // Get secret key from environment
    const secretKey = process.env.NODE_ENV === 'production'
      ? process.env.SQUAD_SECRET_KEY
      : process.env.SQUAD_SANDBOX_SECRET_KEY;

    if (!secretKey) {
      console.error('Squad secret key not configured');
      return res.status(500).json({ 
        success: false, 
        message: 'Configuration error' 
      });
    }

    // In a real implementation, we would decrypt and validate
    // For now, we'll assume validation passes if encrypted_body exists
    
    // If validation is successful, proceed
    next();
  } catch (error) {
    console.error('Error validating encrypted body:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error validating webhook' 
    });
  }
};