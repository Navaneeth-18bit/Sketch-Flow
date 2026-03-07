const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, path: req.path });

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
    code: err.code || "INTERNAL_ERROR",
  });
};

module.exports = errorHandler;
