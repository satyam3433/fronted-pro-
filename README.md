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

The static site is generated in `frontend/dist`.

## Deploy on Vercel

1. Import [the `fronted-pro-` GitHub repository](https://github.com/satyam3433/fronted-pro-) into Vercel.
2. Set the project root to the repository root, build command to `npm run build`, and output directory to `frontend/dist`. Vercel can use the included `vercel.json` for these settings.
3. Deploy. No environment variables or backend URL are needed for this demo.

This demo is for preview only. It has no production authentication or server-side database.
