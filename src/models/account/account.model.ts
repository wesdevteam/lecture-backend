/**
 * @fileoverview
 * Account (User) database model.
 *
 * This module defines the MongoDB schema and model for user accounts.
 * It represents registered users in the system and is used throughout
 * authentication and authorization workflows.
 *
 * @remarks
 * This model is intentionally minimal and focused on authentication data.
 * Additional profile-related fields should be stored in separate schemas
 * or extended cautiously to avoid bloating the core account model.
 */

import { AccountDocumentType } from "@/types/models/account.type";
import { model, Model, Schema } from "mongoose";

/**
 * Mongoose schema definition for the Account collection.
 *
 * ## Fields
 * - `name` (string, required)
 *   The user's display name.
 *
 * - `email` (string, required, unique)
 *   The user's email address.
 *   Acts as the primary unique identifier for authentication.
 *
 * - `password` (string, required)
 *   The hashed password.
 *   **Never store or expose plain-text passwords.**
 *
 * ## Timestamps
 * Automatically adds:
 * - `createdAt`
 * - `updatedAt`
 *
 * @security
 * - Enforces unique email constraint at the database level
 * - Stores only hashed passwords
 */
const AccountSchema = new Schema<AccountDocumentType>(
  {
    /**
     * User's display name.
     */
    name: { type: String, required: true },

    /**
     * User's email address.
     *
     * Must be unique across all accounts.
     */
    email: { type: String, required: true, unique: true },

    /**
     * Hashed password.
     *
     * @remarks
     * Password hashing is performed before persistence
     * using bcrypt or a similar algorithm.
     */
    password: { type: String, required: true },
  },
  {
    /**
     * Enables automatic timestamp fields.
     */
    timestamps: true,
  },
);

/**
 * Account Mongoose model.
 *
 * Provides access to CRUD operations for the `accounts` collection.
 *
 * @typeParam AccountDocumentType - The TypeScript type representing an Account document
 *
 * @remarks
 * This model is used by the authentication service layer and should not
 * be accessed directly by controllers.
 */
const Account: Model<AccountDocumentType> = model<
  AccountDocumentType,
  Model<AccountDocumentType>
>("accounts", AccountSchema);

export default Account;
