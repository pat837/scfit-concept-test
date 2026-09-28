# SCFit Concept Test

An anonymous, five-step concept test for the SCFit fitness-community prototype. The frontend is a Vite app; FastAPI stores anonymous sessions and completed responses in PostgreSQL. Participant emails are optional and are never included in aggregate metrics.

## Local Development

### 1. Create a PostgreSQL database

Install and start PostgreSQL if it is not already running. On macOS with Homebrew:

```sh
brew install postgresql@16
brew services start postgresql@16
createdb scfit
```

If PostgreSQL is already installed and running, just run `createdb scfit`. Tables are created automatically when the API starts.

### 2. Create the backend virtual environment and install packages

From the project root:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Create `.env` and set backend configuration

```sh
cp .env.example .env
```

Open `.env` and set:

```dotenv
DATABASE_URL=postgresql://localhost:5432/scfit
ADMIN_API_KEY=replace-with-a-long-random-value
FRONTEND_ORIGIN=http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000
```

Use a long, private admin key. If your local PostgreSQL requires a username/password, include them in `DATABASE_URL` (for example, `postgresql://username:password@localhost:5432/scfit`). Never commit `.env`.

### 4. Start FastAPI

In a terminal from the project root:

```sh
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

The API is at <http://localhost:8000>; health check: <http://localhost:8000/health>.

### 5. Start the frontend

In a second terminal:

```sh
cd frontend
npm install
npm run dev -- --port 3000
```

Open <http://localhost:3000>. Complete the survey and open the prototype in a new tab when prompted. The form remembers an unfinished survey in this browser. Completed sessions cannot be submitted twice.

### 6. Verify admin metrics and download responses

Set `ADMIN_API_KEY` in `.env`, restart FastAPI after changing it, and use that same value in the `X-Admin-Key` header:

```sh
curl -H "X-Admin-Key: replace-with-a-long-random-value" http://localhost:8000/api/admin/metrics
curl -H "X-Admin-Key: replace-with-a-long-random-value" -o scfit-concept-test-responses.xlsx http://localhost:8000/api/admin/export.xlsx
```

The workbook contains a `Responses` sheet and a `Summary` sheet. Admin endpoints return 401 without a valid key.

## Production Deployment

This app deploys as **two separate services**: the questionnaire frontend on Netlify
(its own site, separate from the existing `scfit-fitness.netlify.app` prototype) and
the FastAPI backend + PostgreSQL on Render. You do not need deep DevOps knowledge —
follow these steps in order.

### A. GitHub

```sh
cd /path/to/SCFit
git init                     # only if not already a repository
git add -A
git commit -m "SCFit concept test: production-ready"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

Before pushing, confirm nothing sensitive is staged: `git status` should not show
`.env`, `.venv/`, `node_modules/`, `dist/`, `__pycache__/`, or any `.xlsx` export.
These are already excluded by `.gitignore`.

### B. Render PostgreSQL (fresh production database)

1. In the Render dashboard: **New → PostgreSQL**.
2. Give it a name (e.g. `scfit-db`), choose a region, and create it. This database
   starts empty — it will **not** contain any of the local test responses.
3. Once created, open the database page and copy the **Internal Database URL**
   (use the internal URL if the FastAPI service will also run on Render, in the same
   region — it's faster and free of egress; use the External URL only if connecting
   from outside Render).

### C. Render FastAPI Web Service

1. In the Render dashboard: **New → Web Service** → connect this GitHub repository.
2. **Root Directory:** leave blank (repository root) — the backend is imported as
   the `backend` package from the root.
3. **Runtime:** Python 3.
4. **Build Command:**
   ```sh
   pip install -r backend/requirements.txt
   ```
5. **Start Command:**
   ```sh
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
6. **Environment Variables** (Render service → Environment):
   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | the Render PostgreSQL Internal Database URL from step B |
   | `ADMIN_API_KEY` | a long random secret, e.g. output of `openssl rand -hex 32` |
   | `FRONTEND_ORIGIN` | the Netlify questionnaire origin, e.g. `https://scfit-concept-test.netlify.app` (set after step D/E; a placeholder is fine for the first deploy) |
7. Deploy. Render builds and starts the service; tables are created automatically
   on first startup (`Base.metadata.create_all` runs in the app's lifespan).
8. Test immediately: `curl https://<your-service>.onrender.com/health` should
   return `{"status":"ok"}`.

### D. Netlify (questionnaire frontend)

1. In Netlify: **Add new site → Import an existing project** → select this
   repository. This must be a **new, separate site** from `scfit-fitness.netlify.app`.
2. **Base directory:** `frontend`
3. **Build command:** `npm run build`
4. **Publish directory:** `frontend/dist` (Netlify shows this as `dist` once the
   base directory is set to `frontend`; `frontend/netlify.toml` already sets
   `command = "npm run build"` and `publish = "dist"` and includes an SPA-style
   redirect (`/* → /index.html`) so refreshing the deployed page never 404s).
5. **Environment variable:** `VITE_API_BASE_URL` = the Render API origin from
   step C, e.g. `https://scfit-api.onrender.com` (origin only — no trailing slash,
   no `/health` or `/api` suffix).
6. Deploy. Note the resulting site URL (e.g. `https://scfit-concept-test.netlify.app`).

### E. Connect Netlify and Render

1. Take the real Netlify site URL from step D and set it as `FRONTEND_ORIGIN` on
   the Render service (step C, env vars). Multiple origins can be comma-separated
   if you also test from a second domain.
2. Take the real Render service URL from step C and confirm it matches
   `VITE_API_BASE_URL` in Netlify (step D). If you change either value, redeploy
   the other service so the new setting takes effect (Render: manual redeploy or
   it auto-redeploys on env var save; Netlify: trigger deploy after saving env vars).

### F. Production verification

Run through the full flow against the live URLs:

1. Open the Netlify questionnaire URL — it loads without errors.
2. Start the survey — confirms `POST /api/sessions` reaches Render (creates a session).
3. Answer Q1–Q7 (About You, Current Experience) and continue.
4. Click **Explore SCFit Prototype ↗** — it opens `https://scfit-fitness.netlify.app/`
   in a new tab and the click posts `POST /api/events/prototype-opened`.
5. Confirm the "ready to continue" button is disabled until the prototype was opened.
6. Click **I explored the prototype and I'm ready to continue** — posts
   `POST /api/events/prototype-returned` and unlocks Q8–Q17.
7. Answer Q8–Q17 (Prototype Feedback, Future Pilot Interest), including testing the
   conditional email field (Yes/Maybe shows it, No hides it).
8. Submit — `POST /api/responses` succeeds and the success screen appears.
9. Confirm the row exists in the Render PostgreSQL database (Render dashboard →
   database → Connect, or `psql` with the External URL).
10. `curl -H "X-Admin-Key: <ADMIN_API_KEY>" https://<render-url>/api/admin/metrics`
    reflects the new response.
11. `curl -H "X-Admin-Key: <ADMIN_API_KEY>" -o export.xlsx https://<render-url>/api/admin/export.xlsx`
    downloads a valid workbook with `Responses` and `Summary` sheets.
12. Requests to admin endpoints without the header, or with the wrong key, return `401`.
13. Load the Netlify URL on a phone (or a narrow browser window) and confirm the
    layout uses nearly the full width with comfortable padding.

The app does not collect IP addresses or exact location. Do not share admin
credentials or the response workbook publicly; the workbook includes optional
participant emails.

