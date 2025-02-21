"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitConfigs = void 0;
exports.rateLimit = rateLimit;
const server_1 = require("next/server");
// In-memory store for rate limiting
const requestStore = new Map();
// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requestStore.entries()) {
        const windowStart = now - exports.rateLimitConfigs.formSubmission.windowMs;
        const validTimestamps = timestamps.filter((ts) => ts > windowStart);
        if (validTimestamps.length === 0) {
            requestStore.delete(key);
        }
        else {
            requestStore.set(key, validTimestamps);
        }
    }
}, 60000); // Clean up every minute
function rateLimit(ip, endpoint, config) {
    const key = `${endpoint}:${ip}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    // Get existing timestamps and filter out old ones
    const timestamps = requestStore.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);
    if (validTimestamps.length >= config.maxRequests) {
        return new server_1.NextResponse(JSON.stringify({
            error: "Too many requests",
            message: "Please try again later",
        }), {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": config.maxRequests.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": (windowStart + config.windowMs).toString(),
            },
        });
    }
    // Add current request timestamp
    validTimestamps.push(now);
    requestStore.set(key, validTimestamps);
    // Calculate remaining requests
    const remaining = Math.max(0, config.maxRequests - validTimestamps.length);
    // Return null to indicate rate limit not exceeded
    return null;
}
// Rate limit configurations for different endpoints
exports.rateLimitConfigs = {
    formSubmission: {
        maxRequests: 10, // 10 submissions
        windowMs: 60 * 60 * 1000, // per hour
    },
    templateCreation: {
        maxRequests: 50, // 50 templates
        windowMs: 24 * 60 * 60 * 1000, // per day
    },
    templateCustomization: {
        maxRequests: 100, // 100 customizations
        windowMs: 24 * 60 * 60 * 1000, // per day
    },
};
