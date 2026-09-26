import { describe, expect, it } from "vitest";
import { montarVcard, telefoneInternacional } from "./vcard";

describe("vcard", () => {
  it("coloca o telefone no formato internacional", () => {
    expect(telefoneInternacional("21964661738")).toBe("+5521964661738");
    expect(telefoneInternacional("5521964661738")).toBe("+5521964661738");
  });

  it("monta um contato por cliente e escapa vírgulas", () => {
    const vcf = montarVcard(
      [
        { nome: "Ana, a cacheada", telefone: "21999990000", email: null },
        { nome: "Bia", telefone: "21988880000", email: "bia@ex.com", desde: "26/09/2026" },
      ],
      "Cliente Carol Rios Curly Studio",
    );
    expect(vcf.match(/BEGIN:VCARD/g)).toHaveLength(2);
    expect(vcf).toContain("FN:Ana\\, a cacheada");
    expect(vcf).toContain("TEL;TYPE=CELL:+5521988880000");
    expect(vcf).toContain("EMAIL:bia@ex.com");
    expect(vcf).toContain("NOTE:Cliente desde 26/09/2026");
  });
});
