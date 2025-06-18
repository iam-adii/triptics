import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { ApiError } from '../middleware/errorHandler';

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }
    
    const result = await authService.verifyCredentials(email, password);
    
    if (!result.success) {
      throw new ApiError(401, result.error || 'Invalid credentials');
    }
    
    res.json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: err.message || 'An unexpected error occurred'
      });
    }
  }
};

// Register user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }
    
    // Only allow admin role if the request is from an admin
    const requestedRole = role && req.user?.role === 'admin' ? role : 'user';
    
    const result = await authService.registerUser(
      email,
      password,
      firstName || '',
      lastName || '',
      requestedRole
    );
    
    if (!result.success) {
      throw new ApiError(400, result.error || 'Registration failed');
    }
    
    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: err.message || 'An unexpected error occurred'
      });
    }
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: err.message || 'An unexpected error occurred'
      });
    }
  }
}; 