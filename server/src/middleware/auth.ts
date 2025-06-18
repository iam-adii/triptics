import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

// Optional authentication middleware - continues if no token is present
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
  } catch (error) {
    // Invalid token, but we'll continue anyway
    console.warn('Invalid token provided in optionalAuth');
  }
  
  next();
}; 