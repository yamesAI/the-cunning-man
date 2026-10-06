// Inline the built JS/CSS into a single self-contained HTML file (dist/single.html).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
let html = readFileSync(join(dist, "index.html"), "utf8");

for (const f of readdirSync(join(dist, "assets"))) {
  const p = join(dist, "assets", f);
  if (f.endsWith(".js")) {
    const js = readFileSync(p, "utf8").replace(/<\/script>/g, "<\\/script>");
    html = html.replace(
      new RegExp(`<script[^>]*src="[^"]*${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>\\s*</script>`),
      () => `<script type="module">\n${js}\n</script>`
    );
  } else if (f.endsWith(".css")) {
    const css = readFileSync(p, "utf8").replace(/<\/style>/g, "<\\/style>");
    html = html.replace(
      new RegExp(`<link[^>]*href="[^"]*${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`),
      () => `<style>\n${css}\n</style>`
    );
  }
}

writeFileSync(join(dist, "single.html"), html);
console.log(`single.html written: ${(html.length / 1024).toFixed(0)} KB`);
