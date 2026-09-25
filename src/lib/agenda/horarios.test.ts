import { describe, expect, it } from "vitest";
import { diaDaSemana, horariosLivres, somarDias } from "./horarios";

const base = {
  data: "2026-10-02", // sexta-feira
  expediente: { abre: "09:00", fecha: "12:00" },
  duracaoMinutos: 60,
  funcionarias: ["carol", "ju"],
  ocupados: [],
  agora: new Date("2026-10-01T12:00:00-03:00"),
};

describe("horariosLivres", () => {
  it("oferece horários de 30 em 30 minutos que cabem no expediente", () => {
    const livres = horariosLivres(base);
    expect(livres.map((h) => h.inicio)).toEqual([
      "2026-10-02T12:00:00.000Z",
      "2026-10-02T12:30:00.000Z",
      "2026-10-02T13:00:00.000Z",
      "2026-10-02T13:30:00.000Z",
      "2026-10-02T14:00:00.000Z",
    ]);
  });

  it("tira a profissional ocupada e mantém a outra", () => {
    const livres = horariosLivres({
      ...base,
      ocupados: [{ funcionaria_id: "carol", inicio: "2026-10-02T12:00:00.000Z", fim: "2026-10-02T13:00:00.000Z" }],
    });
    expect(livres[0]).toEqual({ inicio: "2026-10-02T12:00:00.000Z", funcionarias: ["ju"] });
    expect(livres.find((h) => h.inicio === "2026-10-02T13:00:00.000Z")?.funcionarias).toEqual(["carol", "ju"]);
  });

  it("some com o horário quando todas estão ocupadas", () => {
    const livres = horariosLivres({
      ...base,
      funcionarias: ["carol"],
      ocupados: [{ funcionaria_id: "carol", inicio: "2026-10-02T12:30:00.000Z", fim: "2026-10-02T13:30:00.000Z" }],
    });
    expect(livres.map((h) => h.inicio)).toEqual(["2026-10-02T13:30:00.000Z", "2026-10-02T14:00:00.000Z"]);
  });

  it("não oferece horários com menos de uma hora de antecedência", () => {
    const livres = horariosLivres({ ...base, agora: new Date("2026-10-02T09:45:00-03:00") });
    expect(livres[0].inicio).toBe("2026-10-02T14:00:00.000Z"); // 9h45 + 1h = 10h45, próximo horário às 11h
  });

  it("fica vazio em dia sem expediente", () => {
    expect(horariosLivres({ ...base, expediente: null })).toEqual([]);
  });
});

describe("datas", () => {
  it("calcula o dia da semana no fuso do salão", () => {
    expect(diaDaSemana("2026-10-02")).toBe(5);
    expect(somarDias("2026-10-31", 1)).toBe("2026-11-01");
  });
});
