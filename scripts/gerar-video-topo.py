"""Gera o vídeo do topo da home a partir das fotos carol-15 e carol-17 em public/midia/topo/.

A carol-17 é alinhada uma única vez sobre a carol-15 (rosto e cabelo no mesmo lugar), e uma
câmera só faz um zoom lento em torno do rosto, igual para as duas fotos. Assim não há
deslocamento para os lados: a imagem só se aproxima, antes, durante e depois da fusão.

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

# Alinhamento da carol-17 sobre a carol-15 (medido pelo cabelo/rosto): p15 = ESCALA * p17 + DESLOC.
ESCALA, DESLOC = 1.015, (-4.0, 16.0)
# Janela inicial da câmera, em px da carol-15 (2:3, dentro das duas fotos alinhadas),
# e ponto fixo do zoom (rosto): ele fica parado no quadro enquanto a imagem se aproxima.
JANELA = (6.0, 16.0, 1094.0, 1648.0)
FOCO = (680.0, 480.0)
ZOOM_FIM = 1.12
DURACAO = 5.6
FUSAO = (1.9, 1.6)  # início e duração da passagem da 15 para a 17


def zoom(t):
    # Quase constante, com início e fim macios (70% linear + 30% seno).
    x = min(max(t / DURACAO, 0.0), 1.0)
    k = 0.7 * x + 0.3 * (0.5 - 0.5 * math.cos(math.pi * x))
    return 1 + (ZOOM_FIM - 1) * k


def janela(t):
    z = zoom(t)
    fx, fy = FOCO
    x0, y0, x1, y1 = JANELA
    return (fx + (x0 - fx) / z, fy + (y0 - fy) / z, fx + (x1 - fx) / z, fy + (y1 - fy) / z)


def recorte(img, caixa, desfoque):
    q = img.resize((L, A), Image.LANCZOS, box=caixa)
    if desfoque > 0.3:
        q = q.filter(ImageFilter.GaussianBlur(desfoque))
    return np.asarray(q, dtype=np.float32) ** 2.2  # mistura em luz linear


def main():
    f15 = Image.open(PASTA / "carol-15.webp").convert("RGB")
    f17 = Image.open(PASTA / "carol-17.webp").convert("RGB")
    dx, dy = DESLOC
    quadros = []
    for n in range(round(DURACAO * FPS)):
        t = n / FPS
        x = min(max((t - FUSAO[0]) / FUSAO[1], 0.0), 1.0)
        a = x * x * x * (x * (6 * x - 15) + 10)  # smootherstep
        desfoque = 2.0 * math.sin(math.pi * a)  # leve, só no meio da fusão
        c = janela(t)
        c17 = ((c[0] - dx) / ESCALA, (c[1] - dy) / ESCALA, (c[2] - dx) / ESCALA, (c[3] - dy) / ESCALA)
        acc = np.zeros((A, L, 3), np.float32)
        if a < 1:
            acc += (1 - a) * recorte(f15, c, desfoque)
        if a > 0:
            acc += a * recorte(f17, c17, desfoque)
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
