import { NextFunction, Request, Response } from 'express';
import logger from './logger';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public stack: string = ''
  ) {
    super(message);
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Type guard for ApiError
function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// Centralized error handling middleware
const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: ApiError;

  // Handle different error types
  if (isApiError(err)) {
    error = err;
  } else if (err instanceof Error) {
    error = new ApiError(500, err.message, false, err.stack);
  } else {
    error = new ApiError(500, 'Internal Server Error', false);
  }

  // Log the error with context
  logger.error(
    `[${req.method}] ${req.path} >> StatusCode:: ${error.statusCode}, Message:: ${error.message}`,
    {
      method: req.method,
      url: req.originalUrl,
      statusCode: error.statusCode,
      stack: error.stack,
      body: req.body,
      params: req.params,
      query: req.query,
      user: (req as any).user?.id || 'anonymous',
      isOperational: error.isOperational
    }
  );

  // Prepare error response
  const errorResponse: Record<string, unknown> = {
    success: false,
    message: error.message
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Include validation errors if they exist
  if ((error as any).errors) {
    errorResponse.errors = (error as any).errors;
  }

  // Send response
  res.status(error.statusCode).json(errorResponse);
};

// Factory functions for common errors
const badRequestError = (message: string) => new ApiError(400, message);
const unauthorizedError = (message: string = 'Unauthorized') => new ApiError(401, message);
const forbiddenError = (message: string = 'Forbidden') => new ApiError(403, message);
const notFoundError = (message: string = 'Not Found') => new ApiError(404, message);
const conflictError = (message: string) => new ApiError(409, message);
const internalServerError = (message: string = 'Internal Server Error') => 
  new ApiError(500, message, false);

// Special validation error formatter
const validationError = (errors: Record<string, string[]>) => {
  const error = new ApiError(422, 'Validation failed');
  (error as any).errors = errors; // Attach validation errors
  return error;
};

// Async handler wrapper
const asyncHandler = <T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) => (req: T, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export {
  ApiError,
  errorHandler,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError,
  internalServerError,
  validationError,
  asyncHandler,
  isApiError
};