import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to whitelist IPs for webhooks
 * Only allows requests from specified IPs to proceed
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP from various possible sources
    const clientIP = req.ip || 
                     req.connection.remoteAddress || 
                     req.headers['x-forwarded-for'] as string;
    
    // Clean the IP address (may contain IPv6 prefix)
    const cleanIP = clientIP ? clientIP.replace(/^.*:/, '') : null;
    
    // Check if the client IP is in the allowed list
    if (cleanIP && allowedIPs.includes(cleanIP)) {
      return next();
    }
    
    // Log the unauthorized attempt
    console.warn(`Unauthorized webhook attempt from IP: ${clientIP} (cleaned: ${cleanIP})`);
    
    // Return 403 Forbidden
    return res.status(403).json({
      success: false,
      message: 'Forbidden: IP not whitelisted'
    });
  };
};