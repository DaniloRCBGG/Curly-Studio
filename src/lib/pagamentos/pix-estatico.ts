// Pix "copia e cola" estático (BR Code do Banco Central) gerado a partir da chave Pix da Carol,
// já com o valor do sinal. Não passa por nenhum provedor: o dinheiro cai direto na conta dela
// e a confirmação é feita à mão no painel.

const campo = (id: string, valor: string) => `${id}${String(valor.length).padStart(2, "0")}${valor}`;

// Nome e cidade só aceitam letras sem acento, números e espaço.
const semAcento = (texto: string, max: number) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max);

// CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no fim do BR Code.
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function montarPixCopiaECola(params: { chave: string; nome: string; cidade: string; valor?: number; identificador?: string }): string {
  const txid = (params.identificador ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const corpo = [
    campo("00", "01"),
    campo("26", campo("00", "br.gov.bcb.pix") + campo("01", params.chave.trim())),
    campo("52", "0000"),
    campo("53", "986"),
    params.valor ? campo("54", params.valor.toFixed(2)) : "",
    campo("58", "BR"),
    campo("59", semAcento(params.nome, 25)),
    campo("60", semAcento(params.cidade, 15)),
    campo("62", campo("05", txid)),
    "6304",
  ].join("");
  return corpo + crc16(corpo);
}
