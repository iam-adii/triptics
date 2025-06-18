import { Request, Response, NextFunction } from 'express';

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found error handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

// Global error handler
export const errorHandler = (err: ApiError | Error, req: Request, res: Response, next: NextFunction) => {
  // Log error
  console.error(err);
  
  // Default to 500 server error
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
}; 