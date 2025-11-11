/**
 * Vercel Serverless Handler
 *
 * Wraps the Express application with serverless-http so the API
 * can run on Vercel's serverless platform. Ensures the MongoDB
 * connection is reused across invocations where possible.
 */

require('dotenv').config();
const serverless = require('serverless-http');
const app = require('../src/app');
const connectDB = require('../src/config/database');

let cachedHandler;
let dbConnectionPromise;

/**
 * Main handler exported for Vercel.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async (req, res) => {
  try {
    dbConnectionPromise ||= connectDB();
    await dbConnectionPromise;

    cachedHandler ||= serverless(app);
    return cachedHandler(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
  }
};
