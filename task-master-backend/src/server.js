/**
 * Server Entry Point
 *
 * This module is the entry point for the application.
 * It initializes the database connection and starts the HTTP server.
 *
 * @module server
 */

// Load environment variables from .env file
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');
const appConfig = require('./config/app');

/**
 * Server Port
 *
 * Port number for the server to listen on.
 * Defaults to 5000 if not specified in environment variables.
 */
const PORT = appConfig.server.port;

/**
 * Initialize Server
 *
 * Connects to the database and starts the HTTP server.
 * Handles initialization errors gracefully.
 *
 * @async
 * @function initializeServer
 * @returns {Promise<void>}
 */
const initializeServer = async () => {
  try {
    // Connect to MongoDB database
    console.log('🔌 Connecting to database...');
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server running in ${appConfig.server.env} mode`);
      console.log(`📡 Listening on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}${appConfig.server.apiPrefix}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    /**
     * Graceful Shutdown Handler
     *
     * Handles server shutdown gracefully by:
     * 1. Stopping new connections
     * 2. Finishing ongoing requests
     * 3. Closing database connections
     * 4. Exiting the process
     */
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('✅ HTTP server closed');

        try {
          // Close database connection
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          console.log('✅ Database connection closed');

          // Exit process
          console.log('👋 Server shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error.message);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    /**
     * Unhandled Rejection Handler
     *
     * Catches unhandled promise rejections and logs them.
     * In production, this should be monitored and alerted.
     */
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise);
      console.error('❌ Reason:', reason);
      // In production, you might want to shut down gracefully
      if (appConfig.server.env === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
      }
    });

    /**
     * Uncaught Exception Handler
     *
     * Catches uncaught exceptions and logs them.
     * Server should be restarted after uncaught exceptions.
     */
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error.message);
      console.error('❌ Stack:', error.stack);
      // Always shut down on uncaught exceptions
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  }
};

/**
 * Start Server
 *
 * Initialize and start the server.
 */
initializeServer();

/**
 * Export server for testing purposes
 */
module.exports = app;
