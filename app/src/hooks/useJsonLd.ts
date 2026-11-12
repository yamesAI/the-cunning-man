// Inject (or clear) a JSON-LD block in document.head, keyed by element id.

import { useEffect } from "react";

export function useJsonLd(id: string, data: Record<string, unknown> | null) {
  const text = data ? JSON.stringify(data) : null;
  useEffect(() => {
    document.getElementById(id)?.remove();
    if (!text) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = text;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [id, text]);
}
