// Inject a JSON-LD block into document.head for the life of the page.

import { useEffect } from "react";

export function useJsonLd(id: string, data: Record<string, unknown>) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(data);
    const prev = document.getElementById(id);
    if (prev) prev.remove();
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
