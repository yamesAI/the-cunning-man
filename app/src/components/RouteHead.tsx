// Per-route head from one table: title, description, canonical, og/twitter
// tags and JSON-LD (src/site/structuredData.ts, src/site/pageMeta.ts). The
// build-time pre-render (scripts/prerender.ts) writes the same values into
// each route's static HTML (QC-SITE-001 M-3, M-4); this keeps them right on
// client-side navigation. Not-found pages get noindex and no canonical (M-2).

import { useEffect } from "react";
import { useLocation } from "react-router";
import { ogImage, routeHead } from "@/site/structuredData";
import { pageMeta } from "@/site/pageMeta";
import { useJsonLd } from "@/hooks/useJsonLd";

function setLink(rel: string, href: string | null) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function setMeta(attr: "name" | "property", key: string, content: string | null) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function RouteHead() {
  const { pathname } = useLocation();
  const head = routeHead(pathname);
  const meta = pageMeta(pathname);
  const image = ogImage(pathname);
  const notFound = head.canonical === null;
  useEffect(() => {
    document.title = meta.title;
    setMeta("name", "description", meta.description);
    setLink("canonical", head.canonical);
    setMeta("property", "og:url", head.canonical);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "robots", notFound ? "noindex" : null);
  }, [head.canonical, meta.title, meta.description, image, notFound]);
  useJsonLd("ld-route", head.jsonLd);
  return null;
}
