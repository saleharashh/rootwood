import { useEffect } from "react";
import { applySeo, type SeoConfig } from "@/lib/seo";

/**
 * Applies document title, description, canonical, social cards and JSON-LD
 * for the current route. Rendered by each page; only one is mounted at a time.
 */
export function Seo(props: SeoConfig) {
  const key = JSON.stringify(props);

  useEffect(() => {
    applySeo(JSON.parse(key) as SeoConfig);
  }, [key]);

  return null;
}
