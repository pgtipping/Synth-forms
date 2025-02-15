interface ConversionConfig {
  watermark: {
    textKeywords: string[];
    styles: {
      color: string;
      rotation: number;
      fontSize: number;
    };
    patterns: {
      urlPattern: RegExp;
      samplePattern: RegExp;
      fullPattern: RegExp;
    };
  };
  directories: string[];
  excludePatterns: string[];
}

const config: ConversionConfig = {
  watermark: {
    textKeywords: [
      "www.businessdriver.ng sample document",
      "businessdriver.ng",
      "sample document",
      "www.businessdriver.ng"
    ],
    styles: {
      color: "#80808080",  // Semi-transparent gray
      rotation: -45,       // Diagonal watermark
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

export default config;

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CONVERSION_CONFIG?: ConversionConfig;
    }
  }
}