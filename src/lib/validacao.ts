// Validação de CPF pelos dígitos verificadores.
export function cpfValido(cpf: string): boolean {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const digito = (base: string, pesoInicial: number) => {
    const soma = [...base].reduce((acc, d, i) => acc + Number(d) * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(n.slice(0, 9), 10) === Number(n[9]) && digito(n.slice(0, 10), 11) === Number(n[10]);
}

export const soDigitos = (v: string) => v.replace(/\D/g, "");

// Só aceita caminhos internos no parâmetro "voltar", para não virar redirecionamento aberto.
export function caminhoSeguro(voltar: unknown, padrao = "/minha-conta"): string {
  // O navegador lê "/\site.com" e "/<tab>/site.com" como "//site.com" (outro site): barra invertida
  // e caracteres de controle ficam de fora.
  return typeof voltar === "string" && voltar.startsWith("/") && !voltar.startsWith("//") && !/[\\\x00-\x1f\x7f]/.test(voltar) ? voltar : padrao;
}
