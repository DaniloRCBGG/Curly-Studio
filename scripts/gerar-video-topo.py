"""Gera o vídeo do topo da home a partir das 3 fotos em public/midia/topo/.

Uma "câmera" virtual faz um zoom lento e contínuo; em cada foto o rosto da Carol é
alinhado no mesmo ponto do quadro, então as fusões longas parecem um único movimento.

Requer: pip install pillow numpy imageio-ffmpeg
Uso:    python3 scripts/gerar-video-topo.py
"""
import math
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "public/midia/topo"
L, A, FPS = 720, 1080, 30

# Ordem das fotos e referência do rosto em cada uma (em px da foto de 1100x1650):
# centro do cabelo no eixo x, linha dos olhos no eixo y e largura do cabelo.
FOTOS = [
    ("carol-15.webp", 680, 510, 500),  # de perfil, rindo
    ("carol-17.webp", 670, 528, 580),  # virando, sorrindo
    ("carol-16.webp", 660, 470, 740),  # olhando para a câmera (quadro final)
]
# Linha do tempo em segundos: início de cada fusão e sua duração.
FUSOES = [(1.7, 1.3), (3.9, 1.4)]
DURACAO = 6.8
# Câmera: largura do cabelo no quadro e posição dos olhos, do início ao fim.
CAB_INI, CAB_FIM = 390, 500
POS_INI, POS_FIM = (440, 385), (440, 318)


def suave(t):  # entra e sai devagar
    t = min(max(t, 0.0), 1.0)
    return 0.5 - 0.5 * math.cos(math.pi * t)


def quadro(img, cx, cy, larg, t, desfoque=0.0):
    k = suave(t / DURACAO)
    cab = CAB_INI + (CAB_FIM - CAB_INI) * k
    px = POS_INI[0] + (POS_FIM[0] - POS_INI[0]) * k
    py = POS_INI[1] + (POS_FIM[1] - POS_INI[1]) * k
    w, h = img.size
    s = max(cab / larg, L / w, A / h)  # px do vídeo por px da foto, sempre cobrindo o quadro
    x0 = min(max(cx - px / s, 0), w - L / s)
    y0 = min(max(cy - py / s, 0), h - A / s)
    caixa = (x0, y0, x0 + L / s, y0 + A / s)
    q = img.resize((L, A), Image.LANCZOS, box=caixa)
    if desfoque > 0.3:
        q = q.filter(ImageFilter.GaussianBlur(desfoque))
    return np.asarray(q, dtype=np.float32)


def peso(t, ini, dur):
    x = min(max((t - ini) / dur, 0.0), 1.0)
    return x * x * x * (x * (6 * x - 15) + 10)  # smootherstep


def main():
    fotos = [(Image.open(PASTA / f).convert("RGB"), cx, cy, lg) for f, cx, cy, lg in FOTOS]
    total = round(DURACAO * FPS)
    quadros = []
    for n in range(total):
        t = n / FPS
        pesos, desfoque = [1.0], 0.0
        for ini, dur in FUSOES:
            a = peso(t, ini, dur)
            pesos = [p * (1 - a) for p in pesos] + [a]
            desfoque = max(desfoque, 3.0 * math.sin(math.pi * a))  # leve desfoque no meio da fusão
        acc = np.zeros((A, L, 3), np.float32)
        for (img, cx, cy, lg), p in zip(fotos, pesos):
            if p > 1e-4:
                acc += p * quadro(img, cx, cy, lg, t, desfoque) ** 2.2  # mistura em luz linear
        quadros.append(np.clip(acc ** (1 / 2.2), 0, 255).astype(np.uint8))

    ff = imageio_ffmpeg.get_ffmpeg_exe()
    base = [ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{L}x{A}", "-r", str(FPS), "-i", "-"]
    saidas = {
        "topo.mp4": ["-c:v", "libx264", "-preset", "veryslow", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"],
        "topo.webm": ["-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-row-mt", "1", "-pix_fmt", "yuv420p", "-an"],
    }
    dados = b"".join(q.tobytes() for q in quadros)
    for nome, args in saidas.items():
        subprocess.run(base + args + [str(PASTA / nome)], input=dados, check=True)
    Image.fromarray(quadros[-1]).save(PASTA / "topo-final.webp", quality=82)


if __name__ == "__main__":
    main()
