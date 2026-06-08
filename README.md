# Code Review App

A two-stage interactive code review tool built with React, TypeScript, Vite, and Node/Express.

---

## Project Structure

```
codereview-app/
├── index.html
├── package.json          # Frontend dependencies
├── vite.config.ts        # Vite config (proxies /api → localhost:4000)
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx           # Stage state machine
│   ├── App.css           # Design system
│   ├── types/index.ts    # Shared TypeScript types
│   ├── hooks/useApi.ts   # Backend fetch hook (with demo fallback)
│   └── components/
│       ├── GiveCode.tsx  # Stage 1: editor + nav + report status
│       └── Report.tsx    # Stage 2: diff view + feedback
└── server/
    ├── package.json      # Server dependencies
    ├── tsconfig.json
    └── src/
        └── index.ts      # Express API server
```

---

## Dependencies

### Frontend

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `@uiw/react-codemirror` | Code editor component |
| `@codemirror/lang-javascript` | JS/TS syntax highlighting |
| `@codemirror/theme-one-dark` | Editor dark theme |
| `axios` | HTTP client for API calls |
| `vite` | Dev server and bundler |
| `typescript` | Type checking |

### Backend

| Package | Purpose |
|---|---|
| `express` | HTTP server |
| `cors` | Cross-origin resource sharing |
| `ts-node` | Run TypeScript directly |
| `nodemon` | Auto-restart on file changes |

---

## Running the App

### Requirements

- **Node.js** v18 or later
- **npm** v9 or later

---

### 1. Install frontend dependencies

```bash
# From the project root (codereview-app/)
npm install
```

### 2. Install server dependencies

```bash
cd server
npm install
cd ..
```

---

### 3. Start the backend server

```bash
cd server
npm run dev
# Server starts on http://localhost:4000
```

### 4. Start the frontend dev server (new terminal)

```bash
# From the project root
npm run dev
# App opens on http://localhost:3000
```

Open your browser at **http://localhost:3000**.

> **No backend?** The app includes built-in demo data and will work without the server running — you'll see a yellow warning banner but all features remain functional.

---

## Production Build

```bash
# Build frontend
npm run build
# Output in dist/

# Build server
cd server && npm run build
# Output in server/dist/

# Run server in production
cd server && npm start
```

---

## Stages

### Stage 1 — Give Code
- Editable CodeMirror editor pre-filled with a starter template
- `previous` / `next` buttons to navigate between exercises
- Description panel with the exercise prompt
- Report status bar (green = pass, red = issues) — click to advance to Stage 2

### Stage 2 — Report
- **Left editor**: your code from Stage 1 (still editable)
- **Right editor**: reference solution from the backend (read-only)
- Feedback panel with backend-supplied explanatory text
- Back button returns to Stage 1
