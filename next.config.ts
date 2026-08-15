import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dmsnfrzqbmzgkwfyittc.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Les photos/documents uploadés par les managers passent par Vercel Image
    // Optimization, dont le quota mensuel (images sources distinctes) est vite
    // atteint car chaque re-upload crée un nouveau fichier horodaté. Une fois
    // le quota dépassé, Vercel renvoie une erreur et les photos ne s'affichent
    // plus. On sert les images telles quelles (déjà servies par le CDN
    // Supabase) pour ne plus dépendre de ce quota.
    unoptimized: true,
  },
};

export default nextConfig;
