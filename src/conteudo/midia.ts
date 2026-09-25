// Fotos do site, em public/midia/ (otimizadas em .webp).
export const midia = {
  // Sequência de fotos do topo da home: tocam como um vídeo curto e param no último quadro,
  // com a Carol ao lado da logo. Sem quadros, o topo mostra só a logo.
  topo: {
    quadros: ["/midia/topo/carol-41.webp", "/midia/topo/carol-42.webp"] as string[],
    enquadramento: "50% 20%", // object-position das fotos no painel
  },
  galeria: [
    { src: "/midia/galeria/carol-10.webp", alt: "Carol sorrindo, de blazer rosé, em frente a uma parede de tijolos" },
    { src: "/midia/galeria/carol-43.webp", alt: "Carol com as mãos nos cachos, de blazer branco" },
    { src: "/midia/galeria/carol-22.webp", alt: "Carol sentada no chão ao lado de plumas de capim-dos-pampas" },
    { src: "/midia/galeria/carol-36.webp", alt: "Carol segurando um secador sob luz alaranjada" },
    { src: "/midia/galeria/carol-14.webp", alt: "Carol com o blazer no ombro, de blusa verde" },
    { src: "/midia/galeria/carol-49.webp", alt: "Carol segurando pincéis de coloração" },
    { src: "/midia/galeria/carol-31.webp", alt: "Retrato da Carol sorrindo, de camisa listrada" },
    { src: "/midia/galeria/carol-54.webp", alt: "Carol encostada numa parede branca, mão no queixo" },
    { src: "/midia/galeria/carol-1.webp", alt: "Carol tomando café e rindo" },
    { src: "/midia/galeria/carol-60.webp", alt: "Carol sorrindo sob um círculo de luz" },
  ],
};
