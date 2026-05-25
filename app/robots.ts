import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/matches", "/standings", "/teams"],
        disallow: ["/admin", "/dashboard", "/manager", "/login", "/logout", "/api", "/_next"],
      },
    ],
    sitemap: "https://ccfo.vercel.app/sitemap.xml",
  };
}
