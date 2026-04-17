const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { startConsumer, stopConsumer } = require("./kafka/consumer");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "notification-service",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4006;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
    });

    // Start Kafka consumer
    await startConsumer();

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("HTTP server closed");
        await stopConsumer();
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error("Forcing shutdown...");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
