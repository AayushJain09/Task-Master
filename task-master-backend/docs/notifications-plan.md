# Notifications & Recurring Reminders - Implementation Plan

This document outlines how to add scalable notification delivery for reminders (including recurring rules) and how to expose recurrence expansion in a windowed, server-driven way. The goal is to avoid client-only horizons, handle long-term recurrence, and support future channels (push, email) without rewrites.

## Principles
- **Single source of truth:** Store one reminder + recurrence rule; do not persist per-occurrence rows.
- **Windowed expansion:** Generate occurrences for a requested window (`from`/`to`) so the calendar and schedulers work across long date ranges.
- **Timezone-safe:** Use the reminder’s `timezone` or user preference; never assume server TZ.
- **Idempotent scheduling:** Jobs keyed by reminderId + occurrence date to prevent duplicates.
- **Pluggable transports:** Abstract push/email so new channels are easy to add.

## Data / Model additions
- `Reminder` already has `recurrence` fields (`cadence`, `interval`, `daysOfWeek`, `customRule`, `anchorDate`) and `timezone`.
- Add a `NotificationToken` collection (userId, deviceToken, platform, lastSeenAt) for push targets.
- Optional: `NotificationLog` for audit/debug (reminderId, occurrenceDate, channel, status).

## Server components
1) **Recurrence expander (shared util):** Deterministic function that, given a reminder, timezone, and `from`/`to` window, returns occurrence timestamps (UTC) + local metadata. This should live in `src/utils/recurrence.js` and be used by both the API and the scheduler.
2) **API endpoint (read-only):** `GET /api/v1/reminders/occurrences?from&to` (auth required). Returns occurrences within the window so the calendar can render arbitrarily far ahead without client-side caps.
3) **Scheduler/worker:**
   - Nightly (or rolling) job that pulls reminders for each user and expands occurrences in the next 30–60 days.
   - Enqueue per-occurrence notification jobs keyed by `reminderId + occurrenceDate` to avoid duplicates.
   - Worker dequeues, fetches user tokens, and sends push (FCM/APNs/Expo). On success/failure, log to `NotificationLog`.
4) **Token management endpoints:**
   - `POST /api/v1/notifications/token` to register/update device token.
   - `DELETE /api/v1/notifications/token/:token` to unregister.
5) **Config:** Queue backend (e.g., BullMQ + Redis), batch size, lead time (e.g., schedule N minutes before occurrence).

## Flow (calendar)
1) Client requests occurrences for visible month (e.g., `from=2025-01-01T00:00:00Z`, `to=2025-02-01T00:00:00Z`).
2) API expands recurrence in that window (timezone-aware) and returns `[ { reminderId, occurrenceDateUtc, localDate, localTime, category } ]`.
3) Client renders dots/list from this response; no hard-coded horizon on device.

## Flow (notifications)
1) Client registers push token after auth.
2) Nightly scheduler expands occurrences in next 30–60 days and enqueues jobs with `runAt = occurrenceUtc - leadTime`.
3) Worker sends push at `runAt`, logs result, and can reschedule the next occurrence if needed.

## Minimal initial scope
- Implement recurrence expander util.
- Expose windowed occurrences API for calendar rendering.
- Add notification token endpoints and a basic scheduler/worker skeleton (even if push transport is stubbed).

## Testing strategy
- Unit test recurrence expander across cadences (none/daily/weekly/custom) and edge TZs (DST boundaries).
- API tests: ensure `/occurrences` respects `from/to`, auth, and returns local metadata.
- Scheduler tests: idempotency on duplicate runs; no double-enqueue for the same occurrence.

## Rollout notes
- Keep existing reminder CRUD unchanged.
- Client: switch calendar to call `/reminders/occurrences` per month instead of expanding locally with a short horizon.
- Later: add email/SMS by plugging new transports into the worker without changing expansion logic.
