"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    watermark: {
        textKeywords: [
            "www.businessdriver.ng sample document",
            "businessdriver.ng",
            "sample document",
            "www.businessdriver.ng"
        ],
        styles: {
            color: "#80808080", // Semi-transparent gray
            rotation: -45, // Diagonal watermark
            fontSize: 72,
        },
        // Additional patterns specific to businessdriver.ng watermarks
        patterns: {
            urlPattern: /www\.businessdriver\.ng/i,
            samplePattern: /sample\s+document/i,
            fullPattern: /www\.businessdriver\.ng\s+sample\s+document/i
        }
    },
    directories: [
        "Free Templates and Forms",
        "templates",
    ],
    excludePatterns: [
        "_clean",
        "-processed",
    ],
};
exports.default = config;
