import { describe, expect, it } from "vitest";
import { emEmbalagens, estoqueBaixo, formatarQuantidade, lerNumero, paraMenorUnidade } from "./estoque";

describe("estoque", () => {
  it("lê números como a equipe digita", () => {
    expect(lerNumero("1,5")).toBe(1.5);
    expect(lerNumero("1.5")).toBe(1.5);
    expect(lerNumero("1.000")).toBe(1000);
    expect(lerNumero("1.250,5")).toBe(1250.5);
    expect(lerNumero("")).toBeNull();
    expect(lerNumero("abc")).toBeNull();
  });

  it("converte embalagens para a menor unidade", () => {
    expect(paraMenorUnidade(3, true, 500)).toBe(1500);
    expect(paraMenorUnidade(0.5, true, 1000)).toBe(500);
    expect(paraMenorUnidade(30, false, 500)).toBe(30);
  });

  it("mostra quantidades legíveis", () => {
    expect(formatarQuantidade(1250, "ml")).toBe("1,25 L");
    expect(formatarQuantidade(300, "g")).toBe("300 g");
    expect(formatarQuantidade(1, "un")).toBe("1 unidade");
    expect(emEmbalagens(1250, 500, "ml")).toBe("2,5 embalagens");
    expect(emEmbalagens(4, 1, "un")).toBeNull();
  });

  it("alerta quando o estoque chega ao mínimo (RN02)", () => {
    expect(estoqueBaixo({ estoque_atual: 100, estoque_minimo: 100, ativo: true })).toBe(true);
    expect(estoqueBaixo({ estoque_atual: 101, estoque_minimo: 100, ativo: true })).toBe(false);
    expect(estoqueBaixo({ estoque_atual: 0, estoque_minimo: 0, ativo: false })).toBe(false);
  });
});
