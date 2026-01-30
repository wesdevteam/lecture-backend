/**
 * @fileoverview
 * JSON Web Token (JWT) generation utility.
 *
 * This module provides a helper function to generate a signed JWT
 * and attach it to the HTTP response as a secure, HTTP-only cookie.
 *
 * It is primarily used during authentication flows such as
 * login and registration.
 *
 * ## Environment Variables
 * - `JWT_SECRET` (required): Secret key used to sign JWTs
 *
 * @security
 * - Tokens are stored in HTTP-only cookies to prevent XSS access
 * - `secure` flag is enabled in production environments
 * - Token expiration is enforced
 */

import type { Response } from "express";
import jwt from "jsonwebtoken";

/**
 * Generates a JWT for the given account and stores it in a cookie.
 *
 * This function:
 * - Signs a JWT containing the account ID
 * - Sets an expiration of 15 days
 * - Attaches the token to the response as a cookie
 *
 * ## Cookie Configuration
 * - `httpOnly`: Prevents JavaScript access to the token
 * - `sameSite: "lax"`: Protects against CSRF while allowing top-level navigation
 * - `secure`: Enabled automatically in production
 *
 * @function generateToken
 *
 * @param accountId - Unique identifier of the authenticated account
 * @param res - Express response object used to set the cookie
 *
 * @returns {void}
 *
 * @throws
 * Throws if `JWT_SECRET` is missing or invalid
 *
 * @example
 * ```ts
 * generateToken(account._id, res);
 * ```
 */
const generateToken = (accountId: string, res: Response): void => {
  /**
   * Create a signed JWT.
   *
   * Payload contains only the account ID to minimize token size
   * and reduce exposure of sensitive information.
   */
  const token = jwt.sign({ accountId }, process.env.JWT_SECRET as string, {
    /**
     * Token expiration duration.
     */
    expiresIn: "15d",
  });

  /**
   * Attach the token to the response as a cookie.
   *
   * Cookie lifetime matches JWT expiration (15 days).
   */
  res.cookie("token", token, {
    /**
     * Cookie expiration in milliseconds.
     */
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days

    /**
     * Prevents client-side JavaScript access to the cookie.
     */
    httpOnly: true,

    /**
     * Controls cross-site request behavior.
     */
    sameSite: "lax",

    /**
     * Ensures cookies are sent only over HTTPS in production.
     */
    secure: process.env.NODE_ENV === "production",
  });
};

export default generateToken;
