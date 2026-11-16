// Build step after `vite build` (QC-SITE-001 M-2, M-3, M-4): writes one static
// HTML file per sitemap route with that route's title, description,
// canonical, og/twitter tags and route JSON-LD, so link unfurlers and non-JS
// crawlers see the page they asked for. Also writes dist/404.html (noindex, no
// canonical, no route JSON-LD) for Vercel to serve with HTTP 404 on unknown
// paths; the app boots in it and shows the matching page or "Page not found".
// The body stays the empty #root: React renders it on load as before.
// Run: vite-node scripts/prerender.ts   (BUNDLE_DIR=<outDir>, default dist)

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { SITE_ORIGIN, ogImage, routeHead } from "../src/site/structuredData";
import { NOT_FOUND_META, pageMeta, type PageMeta } from "../src/site/pageMeta";

const dist = process.env.BUNDLE_DIR ?? new URL("../dist", import.meta.url).pathname;
const template = readFileSync(join(dist, "index.html"), "utf8");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function setTag(html: string, re: RegExp, value: string, what: string): string {
  if (!re.test(html)) throw new Error(`prerender: template has no ${what}`);
  return html.replace(re, (_m, pre: string, post: string) => `${pre}${esc(value)}${post}`);
}

function page(meta: PageMeta, image: string, canonical: string | null, jsonLd: Record<string, unknown> | null): string {
  let h = template;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  h = setTag(h, /(<meta name="description" content=")[^"]*(" \/>)/, meta.description, "description");
  h = setTag(h, /(<meta property="og:title" content=")[^"]*(" \/>)/, meta.title, "og:title");
  h = setTag(h, /(<meta property="og:description" content=")[^"]*(" \/>)/, meta.description, "og:description");
  h = setTag(h, /(<meta property="og:image" content=")[^"]*(" \/>)/, image, "og:image");
  h = setTag(h, /(<meta name="twitter:title" content=")[^"]*(" \/>)/, meta.title, "twitter:title");
  h = setTag(h, /(<meta name="twitter:description" content=")[^"]*(" \/>)/, meta.description, "twitter:description");
  h = setTag(h, /(<meta name="twitter:image" content=")[^"]*(" \/>)/, image, "twitter:image");
  const extra = canonical
    ? [
        `<link rel="canonical" href="${esc(canonical)}" />`,
        `<meta property="og:url" content="${esc(canonical)}" />`,
        ...(jsonLd ? [`<script type="application/ld+json" id="ld-route">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`] : []),
      ]
    : [`<meta name="robots" content="noindex" />`];
  return h.replace(/\n\s*<\/head>/, `\n    ${extra.join("\n    ")}\n  </head>`);
}

const sitemap = readFileSync(join(dist, "sitemap.xml"), "utf8");
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  const url = m[1];
  if (!url.startsWith(SITE_ORIGIN)) throw new Error(`prerender: sitemap URL off-site: ${url}`);
  return url.slice(SITE_ORIGIN.length) || "/";
});

let n = 0;
for (const path of paths) {
  const head = routeHead(path);
  if (!head.jsonLd || !head.canonical) throw new Error(`prerender: ${path} is in the sitemap but has no route JSON-LD or canonical`);
  const out = path === "/" ? join(dist, "index.html") : join(dist, path.slice(1), "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(pageMeta(path), ogImage(path), head.canonical, head.jsonLd));
  n++;
}
writeFileSync(join(dist, "404.html"), page(NOT_FOUND_META, ogImage("/404"), null, null));
console.log(`prerender: ${n} routes + 404.html in ${dist}`);
