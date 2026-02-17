const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  const payload = {
    message: err.message || "Server error",
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  console.error("[payment-service]", {
    method: req.method,
    path: req.originalUrl,
    status: statusCode,
    message: err.message,
  });

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };
