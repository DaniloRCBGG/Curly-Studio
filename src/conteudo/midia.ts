// Fotos do site, em public/midia/ (otimizadas em .webp). As de antes e depois das clientes não ficam aqui:
// a equipe cadastra pelo painel (/equipe/fotos), veja src/lib/antes-depois.ts.
export const midia = {
  // Vídeo do topo da home (gerado das fotos carol-15 e carol-17 por scripts/gerar-video-topo.py):
  // toca uma vez e para no último quadro, com a Carol ao lado da logo. Sem vídeo, o topo mostra só a logo.
  topo: {
    video: { mp4: "/midia/topo/topo.mp4", webm: "/midia/topo/topo.webm" } as { mp4: string; webm: string } | null,
    capa: "/midia/topo/topo-final.webp", // último quadro: aparece antes do vídeo carregar e para quem prefere menos movimento
    enquadramento: "50% 20%", // object-position do vídeo no painel
    logoEm: 2.4, // segundos do vídeo em que a logo aparece: no meio da troca da foto 15 para a 17
  },
};
