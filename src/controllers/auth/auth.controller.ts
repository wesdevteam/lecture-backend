/**
 * @fileoverview
 * Authentication controller module.
 *
 * This module contains HTTP controller handlers for authentication-related
 * operations such as user registration, login, and logout.
 *
 * Controllers in this file are responsible for:
 * - Validating incoming request data
 * - Orchestrating authentication flows
 * - Delegating database operations to service layers
 * - Handling password hashing and verification
 * - Issuing and clearing authentication tokens
 *
 * @remarks
 * Business logic (database access) is intentionally delegated to the
 * service layer to keep controllers thin and maintainable.
 */

import { findAccountS, registerS } from "@/services/auth/auth.service";
import { comparePassword, hashPassword } from "@/utils/bcrypt/bcrypt.util";
import { AppError } from "@/utils/error/app-error.util";
import generateToken from "@/utils/jwt/generate-token";
import { Request, Response } from "express";

/**
 * Registers a new user account.
 *
 * This controller handles the complete user registration lifecycle:
 *
 * ### Registration Flow
 * 1. Extracts required fields from the request body
 * 2. Validates presence of `name`, `email`, and `password`
 * 3. Checks for existing account using the provided email
 * 4. Hashes the password using bcrypt
 * 5. Persists the new account in the database
 * 6. Generates a JWT token and attaches it as an HTTP-only cookie
 * 7. Returns a success response
 *
 * ### Security Notes
 * - Passwords are never stored or logged in plain text
 * - JWT tokens are stored in HTTP-only cookies to mitigate XSS attacks
 * - Duplicate email registration is explicitly blocked
 *
 * @async
 * @function register
 *
 * @param req - Express request object containing user registration payload
 * @param res - Express response object used to send the response
 *
 * @throws AppError
 * - `400 Bad Request` if required fields are missing
 * - `409 Conflict` if an account with the same email already exists
 *
 * @returns {Promise<void>}
 *
 * @example
 * ```http
 * POST /api/auth/register
 * Content-Type: application/json
 *
 * {
 *   "name": "Juan Dela Cruz",
 *   "email": "juan@email.com",
 *   "password": "Password123!"
 * }
 * ```
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  /**
   * Extract registration payload from request body.
   */
  const { name, email, password } = req.body;

  /**
   * Validate required registration fields.
   */
  if (!name || !email || !password) {
    throw new AppError("All fields are required.", 400);
  }

  /**
   * Check if an account already exists with the given email.
   */
  if (await findAccountS({ email })) {
    throw new AppError("Email already exist.", 409);
  }

  /**
   * Hash the user's password before persistence.
   */
  const hashedPassword = await hashPassword(password);

  /**
   * Create a new account record in the database.
   */
  const account = await registerS({
    name,
    email,
    password: hashedPassword,
  });

  /**
   * Generate a JWT token and store it in an HTTP-only cookie.
   */
  generateToken(account._id, res);

  /**
   * Send success response.
   */
  res.status(200).json({ message: "Account registered successfully." });
};

/**
 * Authenticates an existing user.
 *
 * This controller validates user credentials and establishes
 * an authenticated session via a JWT cookie.
 *
 * ### Login Flow
 * 1. Extracts email and password from request body
 * 2. Validates required fields
 * 3. Retrieves account by email
 * 4. Verifies password hash
 * 5. Generates and stores JWT token
 * 6. Returns success response
 *
 * ### Security Notes
 * - Uses bcrypt comparison to prevent timing attacks
 * - Does not expose whether email or password was incorrect
 *
 * @async
 * @function login
 *
 * @param req - Express request object containing login credentials
 * @param res - Express response object used to send the response
 *
 * @throws AppError
 * - `400 Bad Request` if required fields are missing
 * - `404 Not Found` if the account does not exist
 * - `400 Bad Request` if the password is incorrect
 *
 * @returns {Promise<void>}
 *
 * @example
 * ```http
 * POST /api/auth/login
 * Content-Type: application/json
 *
 * {
 *   "email": "juan@email.com",
 *   "password": "Password123!"
 * }
 * ```
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  /**
   * Extract login credentials from request body.
   */
  const { email, password } = req.body;

  /**
   * Validate required login fields.
   */
  if (!email || !password) {
    throw new AppError("All field are required.", 400);
  }

  /**
   * Retrieve account by email.
   */
  const account = await findAccountS({ email });
  if (!account) {
    throw new AppError("Account not found.", 404);
  }

  /**
   * Verify provided password against stored hash.
   */
  const correctPassword = await comparePassword(password, account.password);
  if (!correctPassword) {
    throw new AppError("Incorrect password.", 400);
  }

  /**
   * Generate JWT token and store it in an HTTP-only cookie.
   */
  generateToken(account._id, res);

  /**
   * Send success response.
   */
  res.status(200).json({ message: "Login successfuly." });
};

/**
 * Logs out the currently authenticated user.
 *
 * This controller clears the authentication cookie,
 * effectively invalidating the user's session on the client.
 *
 * @function logout
 *
 * @param req - Express request object
 * @param res - Express response object
 *
 * @returns {void}
 *
 * @remarks
 * This does not invalidate the JWT server-side.
 * Token invalidation is handled by cookie expiration.
 */
export const logout = (req: Request, res: Response): void => {
  /**
   * Clear authentication cookie.
   */
  res.cookie("token", "", { maxAge: 0 });

  /**
   * Send logout confirmation response.
   */
  res.status(200).json({ message: "Logged out successfully" });
};
