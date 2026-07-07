import { rateLimit } from "express-rate-limit";

/**
 * Tight limit for the LLM proxy endpoint — 20 requests per IP per minute.
 * This prevents cost abuse while still allowing genuine interactive use.
 */
export const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait a moment before trying again.",
  },
});
