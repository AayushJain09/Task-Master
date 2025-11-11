/**
 * Root-level Vercel handler
 *
 * Allows Vercel to discover the API by placing the entrypoint in /api.
 * Imports the Express app from task-master-backend.
 */

const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '..', 'task-master-backend', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const serverless = require('serverless-http');
const app = require('../task-master-backend/src/app');
const connectDB = require('../task-master-backend/src/config/database');

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
