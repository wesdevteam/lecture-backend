/**
 * @fileoverview
 * Custom application error class.
 *
 * This module defines a standardized error class used throughout
 * the application to represent expected, controlled errors.
 *
 * `AppError` allows attaching HTTP status codes to errors so that
 * the global error handler can return meaningful responses.
 *
 * @remarks
 * This class is intended for operational errors (e.g. validation,
 * authentication, authorization, business rules), not programming bugs.
 */

/**
 * Application-level error.
 *
 * Extends the native JavaScript `Error` object by adding an HTTP status code.
 * Instances of this class are safely handled by the global error handler.
 *
 * ## When to Use
 * - Invalid user input
 * - Authentication failures
 * - Authorization failures
 * - Resource conflicts or not found cases
 *
 * ## When NOT to Use
 * - Syntax errors
 * - Programmer mistakes
 * - System-level failures (out-of-memory, etc.)
 *
 * @example
 * ```ts
 * throw new AppError("Email already exists", 409);
 * ```
 */
export class AppError extends Error {
  /**
   * HTTP status code associated with the error.
   *
   * Used by the global error handler to determine the response status.
   */
  statusCode: number;

  /**
   * Creates a new application error.
   *
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code to return to the client
   */
  constructor(message: string, statusCode: number) {
    super(message);

    /**
     * Assign HTTP status code.
     */
    this.statusCode = statusCode;

    /**
     * Set error name to the class name for easier identification.
     */
    this.name = this.constructor.name;

    /**
     * Capture stack trace excluding constructor call.
     *
     * @remarks
     * Improves stack trace readability by removing noise from error creation.
     */
    Error.captureStackTrace(this, this.constructor);
  }
}
