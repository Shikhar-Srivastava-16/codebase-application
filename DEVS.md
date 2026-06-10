# Developer Guide — Attaching a Backend

This document explains every touch-point between the frontend and the backend so you can swap in your own data source, test runner, or AI grader.

---

## How the Frontend Talks to the Backend

All API calls go through `src/hooks/useApi.ts`. The Vite dev server proxies every request starting with `/api` to `http://localhost:4000` (configured in `vite.config.ts`).

```
Browser  →  /api/entries  →  Vite proxy  →  http://localhost:4000/api/entries
```

In production, point your reverse proxy (nginx, etc.) the same way.

---

## API Contract

The frontend expects the following three endpoints. All responses are JSON.

---

### `GET /api/entries`

Returns the full list of exercises shown in the UI.

**Response shape:**

```ts
{
  entries: CodeEntry[];
  total: number;
}
```

**`CodeEntry` type:**

```ts
interface CodeEntry {
  id: string;            // unique identifier
  title: string;         // shown in the header
  description: string;   // shown in the description panel (plain text or markdown-safe)
  starterCode: string;   // pre-filled in the editor on Stage 1
  reportCode: string;    // reference solution shown read-only on Stage 2
  reportText: string;    // feedback paragraph shown on Stage 2
  reportStatus: {
    color: 'green' | 'red';   // controls background colour of report bar
    message?: string;          // short status label (e.g. "All tests passed")
  };
}
```

> The `reportStatus.color` field is the only thing that changes the red/green background in the UI. Set it to `'green'` for pass and `'red'` for fail/warning.

---

### `GET /api/entries/:id`

Returns a single entry by its `id`. Useful if you lazy-load exercises.

**Response shape:**

```ts
{ entry: CodeEntry }
```

Returns `404` with `{ error: "Entry not found" }` if the id is unknown.

---

### `POST /api/submit`

Called when the user navigates away from an exercise (or you can trigger it explicitly). Delivers the user's current code to the backend.

**Request body:**

```ts
{
  entryId: string;
  code: string;
}
```

**Response shape:**

```ts
{
  ok: true;
  entryId: string;
  reportStatus: {
    color: 'green' | 'red';
    message?: string;
  };
}
```

> You can use this endpoint to run unit tests, a linter, or an AI code review, then return an updated `reportStatus`. The frontend currently does not re-render based on this response — add that in `useApi.ts` if you want live feedback.

---

## Changing the Backend URL

Edit `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://YOUR_SERVER:PORT',
      changeOrigin: true,
    }
  }
}
```

For production builds, set a `VITE_API_BASE` env variable and update `src/hooks/useApi.ts`:

```ts
const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';
```

---

## Adding Live Report Updates

Currently `reportStatus` is read once when entries load. To make the report bar update after a user submits code:

1. In `useApi.ts`, update the matching entry in state inside `submitCode`:

```ts
const submitCode = useCallback(async (entryId: string, code: string) => {
  const res = await axios.post<{ reportStatus: ReportStatus }>(`${BASE_URL}/submit`, { entryId, code });
  setEntries(prev =>
    prev.map(e => e.id === entryId ? { ...e, reportStatus: res.data.reportStatus } : e)
  );
}, []);
```

2. Call `submitCode` in `App.tsx` whenever `onNext` / `onPrev` / `onViewReport` fires.

---

## Replacing the Demo Data Fallback

`src/hooks/useApi.ts` contains a `getDemoEntries()` function that runs when the backend is unreachable. Remove or replace it once your backend is stable:

```ts
} catch {
  // Remove the fallback line below in production:
  setEntries(getDemoEntries());
  setError('Backend unavailable');
}
```

---

## Database / CMS Integration

The server in `server/src/index.ts` uses an in-memory array. To connect a real database:

1. Replace the `entries` array with a DB query in each route handler.
2. Example with a hypothetical ORM:

```ts
app.get('/api/entries', async (_req, res) => {
  const entries = await db.codeEntry.findMany({ orderBy: { createdAt: 'asc' } });
  res.json({ entries, total: entries.length });
});
```

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Server listen port |
| `VITE_API_BASE` | `/api` | Frontend API base path (set in `.env`) |

Create a `.env` file in the project root for frontend vars:

```
VITE_API_BASE=/api
```

Create a `.env` in `server/` for server vars:

```
PORT=4000
DATABASE_URL=postgresql://...
```
