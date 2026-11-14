# DineSync Interactive Demo

This is a frontend-only, interactive DineSync demo. It uses sample data and stores changes in the current browser's local storage; it does not connect to a backend or persist data across browsers.

## Stack

- React 18 and React Router 7
- Lucide React icons
- CSS
- esbuild
- Node.js 20+

## Demo sign-in

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@dinesync.demo` | `DineSyncDemo!2026` |
| Captain | `captain@dinesync.demo` | `DineSyncCaptain!2026` |

Use the buttons on the sign-in page to fill either account. Admin can manage tables and export the sample data; Captain can run orders and checkout. Use **Reset demo data** on the sign-in page to restore the starter floor in this browser.

The demo supports adding/editing/deleting tables, orders, itemized bills, food and beverage GST, service charges, table transfers, checkout, cleanup, and dashboard analytics.

## Build

```sh
npm ci
npm run build
```

The static site is generated in `frontend/dist`. To build with a subpath base for GitHub Pages:

```sh
BASE_PATH=/fronted-pro-/ npm run build
```

On Windows PowerShell, use `$env:BASE_PATH = "/fronted-pro-/"` before `npm run build`.

## Deploy on GitHub Pages

The included GitHub Actions workflow builds the static site and deploys it to GitHub Pages on each push to `main`. If Pages is not enabled for the repository, open **Settings → Pages**, select **GitHub Actions** as the build and deployment source, and rerun the workflow.

The demo site URL is `https://satyam3433.github.io/fronted-pro-/` once the Pages workflow completes. The same static build can also be deployed to Vercel using build command `npm run build` and output directory `frontend/dist`.

This demo is for preview only. It has no production authentication or server-side database.
