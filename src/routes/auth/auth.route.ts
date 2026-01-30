/**
 * @fileoverview
 * Authentication routes module.
 *
 * This module defines all HTTP routes related to user authentication.
 * It maps incoming requests to their corresponding controller handlers.
 *
 * ## Route Group
 * Base path: `/api/auth`
 *
 * All routes under this router are responsible for:
 * - Account registration
 * - User login
 * - User logout
 *
 * @remarks
 * This router should be mounted under `/api/auth` in the main application
 * bootstrap file.
 */

import { login, logout, register } from "@/controllers/auth/auth.controller";
import { Router } from "express";

/**
 * Express router instance for authentication routes.
 *
 * @remarks
 * This router groups all authentication-related endpoints to keep
 * route organization clean and modular.
 */
export const authRouter = Router();

/**
 * Register a new user account.
 *
 * @route POST /api/auth/register
 *
 * @body
 * - `name` (string, required): User's full name
 * - `email` (string, required): User's email address
 * - `password` (string, required): User's password
 *
 * @returns
 * - `200 OK` when account registration is successful
 * - Error responses handled by global error middleware
 *
 * @see register
 */
authRouter.post("/register", register);

/**
 * Authenticate an existing user.
 *
 * @route POST /api/auth/login
 *
 * @body
 * - `email` (string, required): User's email address
 * - `password` (string, required): User's password
 *
 * @returns
 * - `200 OK` when login is successful
 * - Error responses handled by global error middleware
 *
 * @see login
 */
authRouter.post("/login", login);

/**
 * Log out the currently authenticated user.
 *
 * @route POST /api/auth/logout
 *
 * @returns
 * - `200 OK` when logout is successful
 *
 * @remarks
 * This endpoint clears the authentication cookie on the client.
 *
 * @see logout
 */
authRouter.post("/logout", logout);
