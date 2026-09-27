import type { NextConfig } from "next";

// Cabeçalhos de segurança em todas as páginas: o site não abre dentro de outro site (golpe de
// clique escondido), o navegador não adivinha tipo de arquivo e o endereço completo não vaza
// para outros sites. O HSTS obriga HTTPS depois da primeira visita.
const cabecalhosDeSeguranca = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: cabecalhosDeSeguranca }];
  },
};

export default nextConfig;
