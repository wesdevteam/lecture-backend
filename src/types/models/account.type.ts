/**
 * @fileoverview
 * Account-related type definitions.
 *
 * This module defines TypeScript types used across the application
 * for representing user account data at different layers:
 * - API responses
 * - Service-layer logic
 * - Database (Mongoose) documents
 *
 * @remarks
 * These types are shared between models, services, and controllers
 * to maintain consistency and strong typing throughout the codebase.
 */

/**
 * Core account data structure.
 *
 * Represents a user account as stored and processed by the system.
 *
 * ## Fields
 * - `_id`
 *   Unique identifier for the account (MongoDB ObjectId as string)
 *
 * - `name`
 *   User's display or full name
 *
 * - `email`
 *   User's email address (unique per account)
 *
 * - `password`
 *   Hashed password string
 *
 * @security
 * - This type includes the `password` field and should **never**
 *   be sent directly to clients without filtering.
 */
export type AccountType = {
  /**
   * Unique account identifier.
   */
  _id: string;

  /**
   * User's display or full name.
   */
  name: string;

  /**
   * User's email address.
   *
   * Acts as the primary unique identifier for authentication.
   */
  email: string;

  /**
   * Hashed password.
   *
   * @remarks
   * Always store hashed passwords. Never expose this field in API responses.
   */
  password: string;
};

/**
 * Account query filter type.
 *
 * Used when querying for accounts in the database.
 *
 * @remarks
 * Defined as a `Partial<AccountType>` to allow flexible filters
 * such as `{ email }`, `{ _id }`, or combined conditions.
 *
 * @example
 * ```ts
 * { email: "user@email.com" }
 * ```
 */
export type AccountFilterType = Partial<AccountType>;

/**
 * Account Mongoose document type.
 *
 * Extends {@link AccountType} with Mongoose `Document` properties
 * such as:
 * - `_id` (ObjectId)
 * - `createdAt`
 * - `updatedAt`
 * - internal Mongoose methods
 *
 * @remarks
 * This type is primarily used in the model layer and should not
 * be exposed directly outside the data access layer.
 */
export type AccountDocumentType = AccountType & Document;
