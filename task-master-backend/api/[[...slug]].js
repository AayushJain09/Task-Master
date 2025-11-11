/**
 * Vercel Catch-all Serverless Handler
 *
 * This handler allows the Express app to run on Vercel's serverless platform.
 * The [[...slug]] pattern ensures every /api/* route is processed by Express
 * while keeping the original request path intact.
 */

require('dotenv').config();

const serverless = require('serverless-http');
const app = require('../src/app');
const connectDB = require('../src/config/database');

let cachedHandler;
let dbConnectionPromise;

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
