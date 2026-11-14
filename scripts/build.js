const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");

const ROOT = path.resolve(__dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const DIST = path.join(FRONTEND, "dist");
const BASE_PATH = `/${String(process.env.BASE_PATH || "").replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");

async function createFrontendContext({ watch = false } = {}) {
  const assets = path.join(DIST, "assets");
  fs.mkdirSync(assets, { recursive: true });
  const context = await esbuild.context({
    entryPoints: [path.join(FRONTEND, "src", "main.jsx")],
    outfile: path.join(assets, "app.js"),
    bundle: true,
    platform: "browser",
    format: "iife",
    target: ["es2020"],
    jsx: "automatic",
    minify: !watch,
    sourcemap: watch,
    loader: { ".jsx": "jsx" },
    logLevel: "info"
  });
  await context.rebuild();
  const html = fs.readFileSync(path.join(FRONTEND, "index.html"), "utf8")
    .replace(/(src|href)="\/assets\//g, (_, attribute) => `${attribute}="${BASE_PATH}assets/`);
  fs.writeFileSync(path.join(DIST, "index.html"), html);
  if (watch) await context.watch();
  return context;
}

if (require.main === module) {
  createFrontendContext().then(context => context.dispose()).catch(error => {
    console.error("Frontend build failed:", error);
    process.exitCode = 1;
  });
}

module.exports = { createFrontendContext };
