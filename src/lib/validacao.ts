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
  return typeof voltar === "string" && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : padrao;
}
