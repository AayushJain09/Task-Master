const assert = require('assert');
const {
  ensureTimeZone,
  getTimeZoneOffset,
  convertLocalPartsToUTC,
  parseDateInputToUTC,
  getStartOfDayUTC,
  getEndOfDayUTC,
  getNowInTimeZone,
  isDateOnlyString,
  buildLocalizedDateTimeMetadata,
} = require('../src/utils/timezone');

const toISO = (date) => date.toISOString();

const runTests = () => {
  const originalWarn = console.warn;
  console.warn = () => {};

  // ensureTimeZone
  assert.strictEqual(ensureTimeZone('America/New_York'), 'America/New_York');
  assert.strictEqual(ensureTimeZone('Invalid/Zone'), 'UTC');

  // getTimeZoneOffset (winter NYC UTC-5 => offset should be 300 minutes)
  const nyOffset = getTimeZoneOffset('America/New_York', new Date('2024-01-15T12:00:00Z'));
  assert.strictEqual(nyOffset, -300);

  // convertLocalPartsToUTC (2024-03-15 10:30 in New York => 14:30 UTC)
  const nyDate = convertLocalPartsToUTC(
    { year: 2024, month: 3, day: 15, hour: 10, minute: 30 },
    'America/New_York'
  );
  assert.strictEqual(toISO(nyDate), '2024-03-15T14:30:00.000Z');

  // parseDateInputToUTC handles ISO strings directly
  const isoInput = parseDateInputToUTC('2024-05-01T15:00:00Z');
  assert.strictEqual(toISO(isoInput), '2024-05-01T15:00:00.000Z');

  // parseDateInputToUTC handles date-only strings relative to timezone (midnight PDT -> 07:00Z)
  const laDateOnly = parseDateInputToUTC('2024-05-01', { timeZone: 'America/Los_Angeles' });
  assert.strictEqual(toISO(laDateOnly), '2024-05-01T07:00:00.000Z');

  // parseDateInputToUTC with override parts (17:00 local)
  const laDateWithTime = parseDateInputToUTC('2024-05-01', {
    timeZone: 'America/Los_Angeles',
    overrideParts: { hour: 17 },
  });
  assert.strictEqual(toISO(laDateWithTime), '2024-05-02T00:00:00.000Z');

  // Start/end of day for Asia/Kolkata (UTC+5:30)
  const reference = new Date('2024-01-10T12:00:00Z');
  const startOfDay = getStartOfDayUTC('Asia/Kolkata', reference);
  const endOfDay = getEndOfDayUTC('Asia/Kolkata', reference);
  assert.strictEqual(toISO(startOfDay), '2024-01-09T18:30:00.000Z');
  const expectedEnd = new Date('2024-01-10T18:29:59.999Z');
  assert.ok(Math.abs(endOfDay.getTime() - expectedEnd.getTime()) <= 2000);

  // isDateOnlyString
  assert.strictEqual(isDateOnlyString('2024-05-01'), true);
  assert.strictEqual(isDateOnlyString('2024-05-01T10:00:00Z'), false);

  // getNowInTimeZone returns structure
  const nowInfo = getNowInTimeZone('UTC');
  assert.ok(nowInfo.date instanceof Date);
  assert.ok(typeof nowInfo.parts.year === 'number');

  // buildLocalizedDateTimeMetadata
  const meta = buildLocalizedDateTimeMetadata('2024-03-15T18:30:00Z', 'Asia/Kolkata');
  assert.strictEqual(meta.localTimezone, 'Asia/Kolkata');
  assert.strictEqual(meta.localDate, '2024-03-16');
  assert.strictEqual(meta.localTime, '00:00');
  assert.ok(meta.localDateTimeDisplay.includes('Mar'));

  console.warn = originalWarn;
  console.log('Timezone utility tests passed ✅');
};

runTests();
