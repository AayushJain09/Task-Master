/**
 * Database Configuration Module
 *
 * This module handles MongoDB database connection using Mongoose.
 * It provides connection establishment, error handling, and connection monitoring.
 *
 * @module config/database
 */

const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB database
 *
 * Features:
 * - Automatic reconnection on connection loss
 * - Connection pooling for better performance
 * - Error handling and logging
 * - Connection state monitoring
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when connection is established
 * @throws {Error} If connection fails after retry attempts
 */
const connectDB = async () => {
  try {
    // Mongoose connection options for optimal performance and stability
    const options = {
      // Maximum number of connections in the connection pool
      maxPoolSize: 10,
      // Minimum number of connections in the connection pool
      minPoolSize: 5,
      // Close sockets after socketTimeoutMS milliseconds of inactivity
      socketTimeoutMS: 45000,
      // Time to wait for initial server selection before failing
      serverSelectionTimeoutMS: 5000,
    };

    // Establish connection to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Monitor connection events for better debugging
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    // Exit process with failure code
    process.exit(1);
  }
};

module.exports = connectDB;
