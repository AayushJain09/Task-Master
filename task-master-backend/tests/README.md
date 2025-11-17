# Timezone Verification Checklist

The automated coverage in `tests/timezone.test.js` exercises the low-level conversion helpers. Use the checklist below when manually validating end-to-end behavior after timezone-related code changes.

1. **Reminders list** – call `GET /api/reminders?timezone=America/New_York` and confirm each item includes `localScheduled*` fields and `meta.timezone` matches the query. Repeat without the query to verify the `X-User-Timezone` header fallback.
2. **Reminder create/update** – create or edit a reminder with a non-default timezone and ensure the `scheduledAt` stored in MongoDB matches the expected UTC moment, while the response echoes the localized metadata.
3. **Task dashboards** – hit `/api/tasks`, `/api/tasks/status/:status`, and `/api/dashboard/metrics` with the `timezone` query parameter to ensure due-date filters and aggregates shift correctly.
4. **Sync workflow** – submit a `/api/reminders/sync` payload that includes the top-level `timezone` field and verify conflicts/serverChanges are localized for that timezone.

Run the timezone unit tests with:

```bash
cd task-master-backend
node tests/timezone.test.js
```
