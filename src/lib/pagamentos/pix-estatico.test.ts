import { describe, expect, it } from "vitest";
import { crc16, montarPixCopiaECola } from "./pix-estatico";

describe("pix estático", () => {
  it("reproduz o exemplo do manual do BR Code do Banco Central", () => {
    const pix = montarPixCopiaECola({ chave: "123e4567-e12b-12d1-a456-426655440000", nome: "Fulano de Tal", cidade: "BRASILIA" });
    expect(pix).toBe(
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D",
    );
  });

  it("inclui o valor, tira acentos e limita nome, cidade e identificador", () => {
    const pix = montarPixCopiaECola({
      chave: "+5521964661738",
      nome: "Carolina Rios de Souza Araújo Cacheada",
      cidade: "São João de Meriti",
      valor: 50,
      identificador: "3f6c1a2e-0b1d-4c5e-9f00-1234567890ab",
    });
    expect(pix).toContain("540550.00");
    expect(pix).toContain("5925Carolina Rios de Souza Ar6");
    expect(pix).toContain("6015Sao Joao de Mer");
    expect(pix).toContain("62290525" + "3f6c1a2e0b1d4c5e9f0012345");
    expect(pix.slice(-4)).toBe(crc16(pix.slice(0, -4)));
  });
});
