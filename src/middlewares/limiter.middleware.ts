/**
 * @fileoverview
 * Global API rate limiting middleware.
 *
 * This module defines a global rate limiter using `express-rate-limit`
 * to protect the API from excessive requests, abuse, and brute-force attacks.
 *
 * The limiter is applied application-wide and affects all incoming requests
 * unless explicitly excluded.
 *
 * ## Environment Variables
 * - `GLOBAL_RATE_LIMIT_MINUTES` (optional)
 *   Duration of the rate limit window in minutes (default: 15)
 *
 * - `GLOBAL_RATE_LIMIT_MAX` (optional)
 *   Maximum number of requests allowed per IP per window (default: 100)
 *
 * @security
 * Rate limiting is a critical defense against:
 * - brute-force login attempts
 * - denial-of-service style abuse
 * - unintentional traffic spikes
 */

import { rateLimit } from "express-rate-limit";

/**
 * Converts minutes to milliseconds.
 *
 * Utility function used to normalize rate-limit window configuration.
 *
 * @param minutes - Number of minutes
 * @returns Milliseconds equivalent
 *
 * @example
 * ```ts
 * const windowMs = toMs(15); // 900000
 * ```
 */
const toMs = (minutes: number): number => minutes * 60 * 1000;

/**
 * Global rate limiter middleware.
 *
 * Applies request rate limits across all API endpoints.
 *
 * ## Default Behavior
 * - Time window: 15 minutes
 * - Max requests: 100 requests per IP per window
 *
 * ## Header Behavior
 * - Uses standardized rate limit headers (`draft-7`)
 * - Disables legacy `X-RateLimit-*` headers
 *
 * ## Response on Limit Exceeded
 * When the limit is exceeded, the server responds with:
 * - HTTP status `429 Too Many Requests`
 * - Standardized rate-limit headers
 *
 * @function globalRateLimiter
 *
 * @returns Express middleware function
 *
 * @remarks
 * If your application runs behind a proxy or load balancer,
 * ensure `app.set("trust proxy", 1)` is configured so IP addresses
 * are resolved correctly.
 */
export const globalRateLimiter = rateLimit({
  /**
   * Duration of the rate limit window (in milliseconds).
   *
   * Derived from `GLOBAL_RATE_LIMIT_MINUTES` environment variable.
   * Defaults to 15 minutes if not provided or invalid.
   */
  windowMs: toMs(Number(process.env.GLOBAL_RATE_LIMIT_MINUTES) || 15),

  /**
   * Maximum number of allowed requests per IP within the time window.
   *
   * Derived from `GLOBAL_RATE_LIMIT_MAX` environment variable.
   * Defaults to 100 requests.
   */
  max: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 100,

  /**
   * Use standardized rate limit headers as defined in IETF draft-7.
   *
   * @see https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers
   */
  standardHeaders: "draft-7",

  /**
   * Disable legacy `X-RateLimit-*` headers.
   *
   * This reduces header clutter and enforces modern standards.
   */
  legacyHeaders: false,
});
