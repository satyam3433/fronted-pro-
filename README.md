# DineSync Frontend

React frontend for DineSync. The API is maintained separately in [Backend-pro](https://github.com/satyam3433/Backend-pro) and hosted on Render.

## Build

```sh
npm ci
npm run build
```

The static site is generated in `frontend/dist`.

## Deploy to Vercel

1. Import `satyam3433/fronted-pro-` into Vercel with the repository root as the project root.
2. Set Build Command to `npm run build` and Output Directory to `frontend/dist`.
3. After the Render API is deployed, replace `YOUR_RENDER_SERVICE` in `vercel.json` with the Render service hostname, for example `my-dinesync-api.onrender.com` (no `https://` and no trailing slash).
4. Commit and push that hostname change, then deploy the frontend.
5. Test sign-in using the production Admin credentials configured in Render.

The Vercel rewrite proxies same-origin `/api` requests to Render. Do not change the frontend to call the Render host directly; the proxy keeps the secure, httpOnly session cookie on the frontend domain. Never put passwords or JWT secrets in frontend code or Vercel build variables.
