import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${err.statusCode}, Message:: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  logger.error(`[${req.method}] ${req.path} >> Internal Server Error: ${err.message}`);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

export default errorMiddleware;