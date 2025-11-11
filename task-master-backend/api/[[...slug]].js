/**
 * Vercel catch-all serverless handler.
 *
 * Wraps the Express app with serverless-http so we can deploy on Vercel.
 * Ensures the Mongo connection is established once and reused across
 * subsequent invocations.
 */

const serverless = require('serverless-http');
const { app } = require('../src/server');
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
