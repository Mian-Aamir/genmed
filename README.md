# GenMed

Patient-facing medicine comparison prototype built with React, Vite, React Router, and plain CSS.

## Project structure

```text
genmed/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── vercel.json
│   ├── node_modules/  (ignored by Git)
│   └── dist/          (ignored by Git)
├── DEVELOPMENT_ACTIVITY_1_GUIDE.md
└── SECURITY_NOTES.md
```

## Run locally

```powershell
Set-Location D:\genmed\frontend
npm run dev
```

For a fresh clone, run `npm ci` in `frontend` first. Existing dependencies have already been moved there.

## Check and build

```powershell
Set-Location D:\genmed\frontend
npm run lint
npm run build
npm run preview
```

## Deployment

- Vercel: set Root Directory to `frontend`, build command to `npm run build`, and output directory to `dist`.
- Netlify: set Base directory to `frontend`, build command to `npm run build`, and publish directory to `dist` relative to that base.
- SPA routing files are `frontend/vercel.json` and `frontend/public/_redirects`.

See DEVELOPMENT_ACTIVITY_1_GUIDE.md for complete source and the manual checklist. Authentication and medicine data are demonstrations; see SECURITY_NOTES.md for backend requirements.
