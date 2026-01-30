/**
 * @fileoverview
 * Authentication service module.
 *
 * This module contains service-layer functions responsible for
 * interacting with the Account model. It encapsulates all database
 * operations related to authentication.
 *
 * @remarks
 * Services abstract database logic away from controllers to:
 * - Improve testability
 * - Enforce separation of concerns
 * - Centralize data access rules
 */

import Account from "@/models/account/account.model";
import { AccountFilterType, AccountType } from "@/types/models/account.type";

/**
 * Finds a single account matching the given filter.
 *
 * This function is commonly used to:
 * - Check if an account already exists (registration)
 * - Retrieve account data during login
 *
 * @async
 * @function findAccountS
 *
 * @param filter - Query filter used to locate the account
 *
 * @returns
 * - The matching account if found
 * - `null` if no account matches the filter
 *
 * @remarks
 * - Uses `findOne` to ensure only a single document is returned
 * - Query execution is explicitly finalized using `.exec()`
 *
 * @example
 * ```ts
 * const account = await findAccountS({ email: "user@email.com" });
 * ```
 */
export const findAccountS = async (
  filter: AccountFilterType,
): Promise<AccountType | null> => {
  const account = await Account.findOne(filter).exec();
  return account as AccountType | null;
};

/**
 * Creates a new account record.
 *
 * This function persists a new user account to the database.
 * It is typically called after:
 * - Input validation
 * - Password hashing
 *
 * @async
 * @function registerS
 *
 * @param data - Partial account data required for creation
 *
 * @returns
 * - The newly created account document
 *
 * @remarks
 * - Schema validation is enforced by Mongoose
 * - Email uniqueness is enforced at the database level
 *
 * @example
 * ```ts
 * const account = await registerS({
 *   name: "Juan Dela Cruz",
 *   email: "juan@email.com",
 *   password: hashedPassword,
 * });
 * ```
 */
export const registerS = async (
  data: Partial<AccountType>,
): Promise<AccountType> => {
  const account = await Account.create(data);
  return account as AccountType;
};
