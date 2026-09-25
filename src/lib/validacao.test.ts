import { describe, expect, it } from "vitest";
import { caminhoSeguro, cpfValido } from "./validacao";

describe("cpfValido", () => {
  it("aceita CPF com dígitos corretos, com ou sem pontuação", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
  });
  it("recusa dígitos errados e sequências repetidas", () => {
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("123")).toBe(false);
  });
});

describe("caminhoSeguro", () => {
  it("só aceita caminhos internos", () => {
    expect(caminhoSeguro("/agendar?servico=1")).toBe("/agendar?servico=1");
    expect(caminhoSeguro("//evil.com")).toBe("/minha-conta");
    expect(caminhoSeguro("https://evil.com")).toBe("/minha-conta");
    expect(caminhoSeguro(null)).toBe("/minha-conta");
  });
});
