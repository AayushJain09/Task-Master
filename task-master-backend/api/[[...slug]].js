/**
 * Vercel Serverless Entry Point
 *
 * Provides a catch-all handler that wraps the Express app with serverless-http
 * and ensures the MongoDB connection is established once per lambda instance.
 */

require('dotenv').config();

const serverless = require('serverless-http');
const { app } = require('../src/server');
const connectDB = require('../src/config/database');

let cachedHandler;
let dbConnectionPromise;

module.exports = async (req, res) => {
  try {
    // Reuse the same database connection across invocations
    dbConnectionPromise ||= connectDB();
    await dbConnectionPromise;

    // Lazily wrap the Express app
    cachedHandler ||= serverless(app);
    return cachedHandler(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
      })
    );
  }
};
