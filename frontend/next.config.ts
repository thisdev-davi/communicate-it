import type { NextConfig } from "next";
import { API_URL } from "./app/ideas";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Foto do perfil vem do CDN do Discord; next/image só aceita domínios listados.
  images: { remotePatterns: [new URL("https://cdn.discordapp.com/avatars/**")] },
  // O navegador chama /api/* no mesmo domínio do front e o Next repassa para o Go. Sem CORS.
  // O destino é fixado no build: na Vercel, API_URL precisa existir antes do deploy.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  // Nenhum site pode abrir as páginas num iframe (clickjacking); X-Frame-Options cobre navegador antigo.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
