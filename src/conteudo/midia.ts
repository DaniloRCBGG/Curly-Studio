// Fotos e vídeos do site. Arquivos ficam em public/midia/.
// Deixe vazio o que ainda não existe: o topo cai para a animação da logo e a galeria mostra espaços reservados.
export const midia = {
  // Vídeo do topo da home: a Carol entra e para ao lado da logo. Toca uma vez e congela no último quadro.
  videoTopo: "" as string,
  posterTopo: "" as string, // imagem mostrada enquanto o vídeo carrega (e para quem pede menos movimento)
  galeria: [] as { src: string; alt: string }[],
};
