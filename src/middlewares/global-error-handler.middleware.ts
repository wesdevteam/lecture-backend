/**
 * @fileoverview
 * Global error handling middleware.
 *
 * This module defines a centralized Express error-handling middleware
 * responsible for catching and formatting all application errors.
 *
 * It ensures:
 * - Consistent error response structure
 * - Proper HTTP status codes
 * - Environment-aware error visibility
 * - Centralized logging for debugging and monitoring
 *
 * @remarks
 * This middleware **must be registered last** in the Express middleware chain
 * to correctly catch errors from all routes and middleware.
 */

import { AppError } from "@/utils/error/app-error.util";
import { NextFunction, Request, Response } from "express";

/**
 * Global Express error handler.
 *
 * This middleware captures any error passed via `next(err)` or thrown
 * from synchronous/async route handlers (when properly forwarded).
 *
 * ## Behavior
 * - Defaults to HTTP 500 for unknown errors
 * - Uses custom status codes for {@link AppError} instances
 * - Logs full error details to the server console
 * - Hides stack traces in production
 * - Exposes stack traces only in development mode
 *
 * ## Error Response Shape
 * ```json
 * {
 *   "success": false,
 *   "message": "Human-readable error message",
 *   "stack": "Error stack trace (development only)"
 * }
 * ```
 *
 * @function globalErrorHandler
 *
 * @param err - The error object thrown or forwarded by the application
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (unused, required by Express signature)
 *
 * @returns {void}
 *
 * @security
 * - Prevents sensitive stack traces from leaking in production
 * - Centralizes error output to avoid inconsistent responses
 *
 * @example
 * ```ts
 * throw new AppError("Unauthorized access", 401);
 * ```
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  /**
   * Determines whether the application is running in development mode.
   *
   * Used to control visibility of stack traces in error responses.
   */
  const isDev = process.env.NODE_ENV === "development";

  /**
   * Default HTTP status code for unknown errors.
   */
  let statusCode = err.statusCode || 500;

  /**
   * Default error message for unknown errors.
   */
  let message = err.message || "Something went wrong.";

  /**
   * Handle known application errors.
   *
   * {@link AppError} allows explicit control over:
   * - HTTP status code
   * - Client-facing error message
   */
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  /**
   * Log error details for debugging and monitoring.
   *
   * @remarks
   * In production, this output should be captured by a logging system
   * such as Winston, Pino, or an APM service.
   */
  console.error(`[ERROR]: ${err.message}\n${err.stack}`);

  /**
   * Send standardized error response.
   *
   * Stack trace is conditionally included only in development mode.
   */
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};
