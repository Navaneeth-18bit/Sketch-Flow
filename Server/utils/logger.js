const morgan = require("morgan");

const logger = {
  info: (message, meta) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta || "");
  },
  error: (message, meta) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, meta || "");
  },
};

const morganLogger = morgan("combined");

module.exports = { logger, morganLogger };
