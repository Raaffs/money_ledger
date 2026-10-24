import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error('Unhandled server error:', err);
  }

  res.status(status).json({
    success: false,
    message,
  });
};
