/**
 * @fileoverview
 * Password hashing and comparison utilities.
 *
 * This module provides helper functions for securely hashing and
 * verifying passwords using `bcryptjs`.
 *
 * @remarks
 * These utilities are used by the authentication service and controllers
 * to ensure passwords are never stored or compared in plain text.
 *
 * @security
 * - Uses salted hashing to protect against rainbow table attacks
 * - Designed to follow industry best practices for password handling
 */

import bcrypt from "bcryptjs";

/**
 * Hashes a plain-text password.
 *
 * This function:
 * - Generates a cryptographic salt
 * - Applies bcrypt hashing
 * - Returns a secure hashed password
 *
 * @async
 * @function hashPassword
 *
 * @param password - Plain-text password provided by the user
 *
 * @returns
 * A bcrypt-hashed password string safe for database storage
 *
 * @remarks
 * - Salt rounds are set to `10`, balancing security and performance
 * - Higher values increase security but also CPU usage
 *
 * @example
 * ```ts
 * const hashed = await hashPassword("MySecret123!");
 * ```
 */
export const hashPassword = async (password: string): Promise<string> => {
  /**
   * Generate a cryptographic salt.
   */
  const salt = await bcrypt.genSalt(10);

  /**
   * Hash the password using the generated salt.
   */
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain-text password against a stored hash.
 *
 * This function safely verifies whether the provided password
 * matches the stored bcrypt hash.
 *
 * @async
 * @function comparePassword
 *
 * @param enteredPassword - Plain-text password entered by the user
 * @param storedPassword - Hashed password retrieved from the database
 *
 * @returns
 * - `true` if the password matches
 * - `false` if the password does not match
 *
 * @security
 * - Resistant to timing attacks
 * - Does not expose hashing details
 *
 * @example
 * ```ts
 * const isValid = await comparePassword(
 *   "MySecret123!",
 *   user.password,
 * );
 * ```
 */
export const comparePassword = async (
  enteredPassword: string,
  storedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};
