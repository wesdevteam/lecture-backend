/**
 * @fileoverview
 * MongoDB database connection module.
 *
 * This module is responsible for initializing and managing the MongoDB
 * connection using Mongoose. It configures global Mongoose options and
 * establishes a single connection for the entire application lifecycle.
 *
 * ## Environment Variables
 * - `MONGO_DB_URI` (required): MongoDB connection string.
 *
 * @remarks
 * This module is typically invoked once during application startup.
 * Reconnecting or calling this function multiple times is discouraged
 * unless connection handling logic is explicitly implemented.
 */

import mongoose from "mongoose";

/**
 * Initializes the MongoDB connection using Mongoose.
 *
 * This function:
 * - Configures Mongoose global query and schema behavior
 * - Establishes a connection to the MongoDB server
 * - Logs connection status for visibility and debugging
 *
 * ## Mongoose Configuration
 * - `strictQuery: true`
 *   Ensures that only fields defined in schemas are allowed in query filters.
 *   This helps prevent unintended or malicious query conditions.
 *
 * - `strict: true`
 *   Enforces schema strictness, discarding fields not defined in the schema
 *   during document creation or updates.
 *
 * ## Connection Behavior
 * - Uses the connection string from `process.env.MONGO_DB_URI`
 * - Relies on Mongoose's internal connection pooling
 *
 * @async
 * @function initDB
 * @returns {Promise<void>} Resolves when the database connection is established.
 *
 * @throws
 * Errors are caught internally and logged. The function does not rethrow
 * to allow the caller to decide how to handle startup failures.
 *
 * @security
 * - Ensures schema and query strictness to reduce injection risk
 * - Requires secure handling of the MongoDB URI (do not log credentials)
 */
export default async function initDB(): Promise<void> {
  try {
    /**
     * Enforces strict filtering of query conditions.
     *
     * Prevents the use of query keys that are not explicitly defined
     * in the Mongoose schema.
     */
    mongoose.set("strictQuery", true);

    /**
     * Enables strict schema enforcement.
     *
     * Fields not defined in the schema will be ignored during
     * document creation and updates.
     */
    mongoose.set("strict", true);

    /**
     * Establishes a connection to the MongoDB database.
     *
     * @remarks
     * The connection URI must be provided via the `MONGO_DB_URI`
     * environment variable.
     */
    await mongoose.connect(process.env.MONGO_DB_URI as string);

    console.log("Connected to MongoDB");
  } catch (err) {
    /**
     * Handles database connection errors.
     *
     * Logs the error and prevents the application from crashing immediately.
     * Upstream logic (process manager, container, or startup script) should
     * decide whether to retry or terminate.
     */
    console.error("MongoDB connection error:", err);
    return;
  }
}
