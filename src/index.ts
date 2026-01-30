/**
 * @fileoverview
 * Main server entrypoint.
 *
 * This module boots an Express application, applies security and utility middleware,
 * registers API routes, attaches global handlers (404 + error handler), and starts
 * an HTTP server. It also initializes the database connection once the server is
 * listening.
 *
 * ## Environment Variables
 * - `PORT` (optional): Port to bind the HTTP server to. Defaults to `5000`.
 * - `CORS_ORIGINS` (optional): Comma-separated list of allowed origins.
 *   Example: `https://app.com,https://admin.app.com`
 *
 * ## Execution
 * This module calls {@link bootstrap} immediately and exits the process if boot fails.
 */

import dotenv from "dotenv";

/**
 * Loads environment variables from `.env` into `process.env`.
 *
 * This must run before the rest of the application reads configuration values
 * such as `PORT` and `CORS_ORIGINS`.
 *
 * @remarks
 * `dotenv.config()` reads a `.env` file (if present) and assigns values to `process.env`.
 * In production, these variables are commonly injected by the hosting environment instead.
 */
dotenv.config();

import expressMongoSanitize from "@exortek/express-mongo-sanitize";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";

import initDB from "@/db/db.connect.js";
import { globalErrorHandler } from "./middlewares/global-error-handler.middleware";
import { globalRateLimiter } from "./middlewares/limiter.middleware";
import { authRouter } from "./routes/auth/auth.route";

/**
 * Bootstraps and starts the HTTP API server.
 *
 * This function builds the Express app, wires up the middleware pipeline,
 * registers routes, attaches global error handlers, then starts an HTTP server.
 *
 * ## High-level Flow
 * 1. Create Express app and configure proxy settings
 * 2. Read runtime configuration from environment variables
 * 3. Apply middleware stack (CORS → security → rate limiting → logging → parsers)
 * 4. Register health route + feature routers
 * 5. Add 404 handler for unknown routes
 * 6. Add centralized error handler
 * 7. Create and start HTTP server
 * 8. Initialize DB connection once the server is listening
 *
 * ## Notes on `trust proxy`
 * `app.set("trust proxy", 1)` is important when deploying behind:
 * - reverse proxies (Nginx)
 * - load balancers (Cloudflare, AWS ALB)
 *
 * It allows Express to correctly understand `X-Forwarded-*` headers (e.g., protocol, IP).
 *
 * @async
 * @returns {Promise<void>} Resolves once the server begins listening.
 *
 * @throws
 * Any unhandled error during boot will bubble up to the caller. In this module,
 * the caller terminates the process to avoid running the app in a broken state.
 */
const bootstrap = async (): Promise<void> => {
  /**
   * The Express application instance.
   *
   * This is the core object where middleware and routes are registered.
   */
  const app = express();

  /**
   * Trust first proxy hop.
   *
   * Required if your app is behind a proxy/load balancer so that:
   * - `req.ip` resolves to the real client IP
   * - secure cookies / protocol detection work correctly
   */
  app.set("trust proxy", 1);

  /**
   * Runtime port configuration.
   *
   * Uses `PORT` from the environment when provided, otherwise defaults to `5000`.
   */
  const PORT = process.env.PORT || 5000;

  /**
   * List of allowed CORS origins.
   *
   * `CORS_ORIGINS` should be a comma-separated list of allowed front-end origins.
   * If not provided, the default becomes an empty list which effectively blocks
   * browser-based cross-origin requests (except same-origin).
   *
   * @example
   * CORS_ORIGINS="https://app.com,https://admin.app.com"
   */
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : [];

  /**
   * -----------------------
   * CORS (Cross-Origin Resource Sharing)
   * -----------------------
   *
   * Controls which browser origins are allowed to call this API.
   *
   * - If `origin` is missing (like curl/Postman or same-origin calls), allow it.
   * - If `origin` exists, allow only if it matches `allowedOrigins`.
   * - Otherwise, reject the request.
   *
   * `credentials: true` enables cookies and authorization headers for cross-origin requests.
   *
   * @security
   * Misconfigured CORS can expose your API to unwanted browser-based access.
   */
  app.use(
    cors({
      /**
       * Dynamic origin validation callback.
       *
       * @param origin - The origin of the incoming request (if present).
       * @param callback - Node-style callback used by the CORS middleware.
       */
      origin: (origin, callback) => {
        // Non-browser clients or same-origin calls may not send an Origin header.
        if (!origin) return callback(null, true);

        // Allow requests only from explicitly whitelisted origins.
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Reject everything else.
        callback(new Error("CORS not allowed"), false);
      },
      credentials: true,
    }),
  );

  /**
   * -----------------------
   * Security Headers (Helmet)
   * -----------------------
   *
   * Sets various HTTP headers to reduce common attack surfaces such as:
   * - clickjacking
   * - MIME sniffing
   * - unsafe inline policies (depending on configuration)
   */
  app.use(helmet());

  /**
   * -----------------------
   * Global Rate Limiting
   * -----------------------
   *
   * Applies a request rate limit to all incoming requests.
   *
   * @remarks
   * This helps mitigate brute-force attempts and high-volume abuse.
   * The exact behavior (window, max requests, etc.) is controlled inside
   * `globalRateLimiter`.
   */
  app.use(globalRateLimiter);

  /**
   * -----------------------
   * HTTP Request Logger
   * -----------------------
   *
   * Logs incoming requests in development format. Useful for debugging.
   */
  app.use(morgan("dev"));

  /**
   * -----------------------
   * JSON Body Parser
   * -----------------------
   *
   * Parses incoming JSON request payloads into `req.body`.
   *
   * @remarks
   * If you expect large payloads, you can configure size limits:
   * `express.json({ limit: "1mb" })`
   */
  app.use(express.json());

  /**
   * -----------------------
   * NoSQL Injection Protection
   * -----------------------
   *
   * Sanitizes user input and removes MongoDB operator injection attempts
   * like `$gt`, `$ne`, `$where`, etc.
   *
   * @security
   * Prevents attackers from manipulating Mongo queries via crafted payloads.
   */
  app.use(expressMongoSanitize());

  /**
   * -----------------------
   * Cookie Parser
   * -----------------------
   *
   * Parses the `Cookie` header and populates `req.cookies`.
   *
   * @remarks
   * Useful for auth flows that use HTTP-only cookies for sessions/tokens.
   */
  app.use(cookieParser());

  /**
   * Health check endpoint.
   *
   * @route GET /api/test
   * @returns 200 - A simple string response confirming the API is running.
   */
  app.get("/api/test", (req, res) => {
    res.status(200).send("Api is running");
  });

  /**
   * Registers authentication routes.
   *
   * @route /api/auth
   * @remarks
   * All auth-related endpoints (e.g., register/login/logout) live under this base path.
   */
  app.use("/api/auth", authRouter);

  /**
   * 404 handler for unknown routes.
   *
   * This middleware runs only if no previous route matched the request.
   * It returns a consistent JSON response to help with debugging and client handling.
   *
   * @returns 404 - Route Not Found with path + method metadata.
   */
  app.use((req, res) => {
    res.status(404).json({
      message: "Route Not Found",
      path: req.originalUrl,
      method: req.method,
    });
  });

  /**
   * Global error handler.
   *
   * Must be registered after all routes and middleware so it can catch:
   * - thrown errors
   * - rejected async handlers (when properly forwarded)
   * - middleware errors
   *
   * @remarks
   * Ensure your route handlers call `next(err)` or throw inside async wrappers
   * so errors reach this handler.
   */
  app.use(globalErrorHandler);

  /**
   * Creates an HTTP server from the Express app.
   *
   * @remarks
   * Using `http.createServer(app)` allows you to later:
   * - attach WebSockets
   * - configure low-level server settings
   * - control timeouts and keep-alive behavior
   */
  const server = http.createServer(app);

  /**
   * Server timeout configuration.
   *
   * Sets the maximum time (in milliseconds) the server will wait before timing out
   * inactive connections or long-running requests.
   *
   * Current value: 300,000 ms (5 minutes)
   */
  server.setTimeout(300000);

  /**
   * Starts the server and initializes the database connection.
   *
   * @remarks
   * DB initialization is triggered once the server is listening to ensure the app
   * is ready to accept connections and to keep startup flow explicit.
   */
  server.listen(PORT, () => {
    initDB();
    console.log(`Server Running on port ${PORT}`);
  });
};

/**
 * Immediately starts the application.
 *
 * If boot fails for any reason, the process exits with status code `1`
 * to prevent running in a partially-initialized state.
 *
 * @remarks
 * Failing fast is a good practice for server applications: the process manager
 * (PM2, Docker, Kubernetes, etc.) can restart the service cleanly.
 */
bootstrap().catch((e) => {
  console.error("Fatal boot error:", e);
  process.exit(1);
});

export default bootstrap;
