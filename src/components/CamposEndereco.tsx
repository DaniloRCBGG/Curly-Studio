"use client";

import { useRef, useState } from "react";

type Endereco = { cep: string; endereco: string; bairro: string; cidade: string };

const formatarCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

// CEP, endereço, bairro e cidade. Ao digitar o CEP, o resto vem do ViaCEP (gratuito) e a pessoa
// só completa o número. Com `obrigatorio`, só o CEP é exigido. O CEP alimenta o mapa de clientes por região no painel da Carol.
export function CamposEndereco({ obrigatorio = false, inicial }: { obrigatorio?: boolean; inicial?: Partial<Endereco> }) {
  const [dados, setDados] = useState<Endereco>({
    cep: formatarCep(inicial?.cep ?? ""),
    endereco: inicial?.endereco ?? "",
    bairro: inicial?.bairro ?? "",
    cidade: inicial?.cidade ?? "Rio de Janeiro",
  });
  const [aviso, setAviso] = useState("");
  const endereco = useRef<HTMLInputElement>(null);
  const mudar = (campo: keyof Endereco) => (e: React.ChangeEvent<HTMLInputElement>) => setDados((d) => ({ ...d, [campo]: e.target.value }));

  async function mudarCep(e: React.ChangeEvent<HTMLInputElement>) {
    const cep = formatarCep(e.target.value);
    setDados((d) => ({ ...d, cep }));
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) return setAviso("");
    setAviso("Buscando endereço…");
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const v = await r.json();
      if (v.erro) return setAviso("CEP não encontrado. Confira os números ou preencha o endereço à mão.");
      setDados((d) => ({
        ...d,
        endereco: v.logradouro ? `${v.logradouro}, ` : d.endereco,
        bairro: v.bairro || d.bairro,
        cidade: v.localidade || d.cidade,
      }));
      setAviso("");
      endereco.current?.focus();
    } catch {
      setAviso("Não conseguimos buscar o CEP agora. Preencha o endereço à mão.");
    }
  }

  return (
    <>
      <div>
        <label className="rotulo" htmlFor="cep">CEP{obrigatorio ? "" : " (opcional)"}</label>
        <input
          className="campo"
          id="cep"
          name="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          pattern="\d{5}-?\d{3}"
          title="CEP com 8 números"
          required={obrigatorio}
          value={dados.cep}
          onChange={mudarCep}
        />
        {aviso && <p className="mt-1 text-xs text-terra/75">{aviso}</p>}
      </div>
      <div>
        <label className="rotulo" htmlFor="bairro">Bairro</label>
        <input className="campo" id="bairro" name="bairro" value={dados.bairro} onChange={mudar("bairro")} />
      </div>
      <div>
        <label className="rotulo" htmlFor="endereco">Endereço e número</label>
        <input
          ref={endereco}
          className="campo"
          id="endereco"
          name="endereco"
          autoComplete="street-address"
          placeholder="Rua, número"
          value={dados.endereco}
          onChange={mudar("endereco")}
        />
      </div>
      <div>
        <label className="rotulo" htmlFor="cidade">Cidade</label>
        <input className="campo" id="cidade" name="cidade" autoComplete="address-level2" value={dados.cidade} onChange={mudar("cidade")} />
      </div>
    </>
  );
}
