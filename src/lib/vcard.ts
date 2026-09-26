// Monta um arquivo .vcf (vCard 3.0) com vários contatos, que o celular importa de uma vez.
export type ContatoVcard = { nome: string; telefone: string | null; email: string | null; desde?: string };

const escapar = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

// Telefones da ficha ficam só com dígitos e com DDD; no vCard vão no formato internacional.
export function telefoneInternacional(digitos: string) {
  const d = digitos.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) return `+${d}`;
  return `+55${d}`;
}

export function montarVcard(contatos: ContatoVcard[], organizacao: string) {
  return contatos
    .map((c) =>
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapar(c.nome)}`,
        `N:;${escapar(c.nome)};;;`,
        `ORG:${escapar(organizacao)}`,
        c.telefone ? `TEL;TYPE=CELL:${telefoneInternacional(c.telefone)}` : null,
        c.email ? `EMAIL:${escapar(c.email)}` : null,
        c.desde ? `NOTE:${escapar(`Cliente desde ${c.desde}`)}` : null,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\r\n"),
    )
    .join("\r\n");
}
