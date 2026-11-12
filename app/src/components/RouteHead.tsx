// Per-route canonical, og:url and JSON-LD from one table (src/site/structuredData.ts).

import { useEffect } from "react";
import { useLocation } from "react-router";
import { routeHead } from "@/site/structuredData";
import { useJsonLd } from "@/hooks/useJsonLd";

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function RouteHead() {
  const { pathname } = useLocation();
  const head = routeHead(pathname);
  useEffect(() => {
    setLink("canonical", head.canonical);
    setMetaProperty("og:url", head.canonical);
  }, [head.canonical]);
  useJsonLd("ld-route", head.jsonLd);
  return null;
}
