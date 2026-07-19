import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/matches", "/standings", "/teams"],
        disallow: ["/admin", "/dashboard", "/manager", "/login", "/logout", "/api", "/_next"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
