/**
 * Timezone Middleware
 *
 * Resolves the requester’s timezone once per request so that downstream
 * controllers and services can rely on req.requestedTimezone or
 * res.locals.requestedTimezone without re-running detection logic.
 */

const { resolveTimezoneFromRequest } = require('../utils/timezone');

const attachTimezone = (req, res, next) => {
  const timezone = resolveTimezoneFromRequest(req);
  if (process.env.NODE_ENV !== 'test') {
    console.log('[TimezoneMiddleware] resolved timezone', timezone, 'for', req.method, req.originalUrl);
  }
  res.locals.requestedTimezone = timezone;
  next();
};

module.exports = attachTimezone;
