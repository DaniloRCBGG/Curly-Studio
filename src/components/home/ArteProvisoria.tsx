// Arte que ocupa o lugar das fotos de antes e depois enquanto a equipe não cadastra as reais.
// O "depois" tem cachos definidos nas cores da marca; o "antes", fios opacos e arrepiados.

// Gerador pseudoaleatório fixo, para o desenho sair igual no servidor e no navegador.
function sorteio(semente: number) {
  let s = semente * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function espiral(cx: number, cy: number, raio: number, voltas: number, ruido: number, rnd: () => number) {
  const passos = Math.round(voltas * 28);
  const giro = rnd() * Math.PI * 2;
  let d = "";
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const ang = giro + t * voltas * Math.PI * 2;
    const r = raio * (0.15 + 0.85 * t) + (rnd() - 0.5) * ruido;
    d += `${i ? "L" : "M"}${(cx + Math.cos(ang) * r).toFixed(1)} ${(cy + Math.sin(ang) * r).toFixed(1)}`;
  }
  return d;
}

export function ArteProvisoria({ tipo, n, rotulo = true }: { tipo: "antes" | "depois"; n: number; rotulo?: boolean }) {
  const rnd = sorteio(n + 1);
  const depois = tipo === "depois";
  const cachos = Array.from({ length: 110 }, () => {
    // Cachos espalhados pelo volume do cabelo, em volta de uma "cabeça" no centro de cima.
    const ang = rnd() * Math.PI * 2;
    const dist = Math.sqrt(rnd()) * 145;
    return { cx: 200 + Math.cos(ang) * dist * 1.12, cy: 205 + Math.sin(ang) * dist, r: depois ? 9 + rnd() * 9 : 10 + rnd() * 12 };
  });
  const tons = depois ? ["#6c9335", "#8a4a2f", "#4a6b22", "#b0703f", "#e5dbd1"] : ["#a29a92", "#77706a", "#c4bdb6"];
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label={`Arte provisória: ${tipo}`}>
      <defs>
        <radialGradient id={`fundo-${tipo}-${n}`} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor={depois ? "#f4efe9" : "#d9d4cf"} />
          <stop offset="100%" stopColor={depois ? "#e5dbd1" : "#bdb6b0"} />
        </radialGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#fundo-${tipo}-${n})`} />
      {/* ombros */}
      <path d="M40 500 C60 400 140 370 200 370 C260 370 340 400 360 500 Z" fill={depois ? "#3d1c11" : "#6f6a65"} opacity={depois ? 0.9 : 0.55} />
      <ellipse cx="200" cy="215" rx="150" ry="155" fill={depois ? "#3d1c11" : "#8b847e"} opacity={depois ? 0.92 : 0.5} />
      {cachos.map((c, i) => (
        <path
          key={i}
          d={espiral(c.cx, c.cy, c.r, depois ? 2.2 : 1.4, depois ? 0.6 : 7, rnd)}
          fill="none"
          stroke={tons[i % tons.length]}
          strokeWidth={depois ? 3 : 1.6}
          strokeLinecap="round"
          opacity={depois ? 0.95 : 0.7}
        />
      ))}
      {rotulo && (
        <text x="380" y="34" textAnchor="end" fontSize="11" fill={depois ? "#3d1c11" : "#5c5751"} opacity="0.6" fontFamily="sans-serif" letterSpacing="2">
          FOTO PROVISÓRIA
        </text>
      )}
    </svg>
  );
}
