# DineSync Frontend

This repository contains only the React user interface for DineSync. It does not contain the Express API or database. Login, floor data, orders, and billing require the separate backend.

## Stack

- React 18 and React Router 7
- Lucide React icons
- CSS
- esbuild
- Node.js 20+

## Build

```sh
npm ci
npm run build
```

The static site is generated in `frontend/dist`.

## Deploy on Vercel

1. Deploy the backend from the [DineSync backend repository](https://github.com/satyam3433/-DINESYNC-PRO-) to a Node.js host with persistent storage.
2. In `vercel.json`, replace `REPLACE-WITH-YOUR-RENDER-SERVICE` with the deployed Render service hostname, without `https://`.
3. Import this repository into Vercel. Use the repository root, build command `npm run build`, and output directory `frontend/dist`.
4. Deploy and sign in using the Admin or Captain credentials configured on the backend.

The `/api` rewrite keeps API requests on the Vercel origin so the backend's HttpOnly session cookie works with the frontend. The placeholder API hostname must be replaced before using the app.
