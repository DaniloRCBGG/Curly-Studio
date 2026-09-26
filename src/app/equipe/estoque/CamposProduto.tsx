import type { Produto } from "@/lib/estoque";

// Campos comuns ao cadastro e à edição de produto.
export function CamposProduto({ produto, fornecedores }: { produto?: Produto; fornecedores: { id: string; nome: string }[] }) {
  return (
    <>
      <div className="sm:col-span-3">
        <label className="rotulo" htmlFor="nome">Nome</label>
        <input className="campo" id="nome" name="nome" defaultValue={produto?.nome} placeholder="Ex.: Máscara de hidratação" required />
      </div>
      <div className="sm:col-span-3">
        <label className="rotulo" htmlFor="marca">Marca (opcional)</label>
        <input className="campo" id="marca" name="marca" defaultValue={produto?.marca ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <label className="rotulo" htmlFor="unidade">Medido em</label>
        <select className="campo" id="unidade" name="unidade" defaultValue={produto?.unidade ?? "ml"}>
          <option value="ml">ml (líquidos)</option>
          <option value="g">g (cremes e pós)</option>
          <option value="un">unidades</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="rotulo" htmlFor="tamanho_embalagem">Quanto vem na embalagem</label>
        <input className="campo" id="tamanho_embalagem" name="tamanho_embalagem" inputMode="decimal" defaultValue={produto?.tamanho_embalagem} placeholder="Ex.: 500" required />
      </div>
      <div className="sm:col-span-2">
        <label className="rotulo" htmlFor="valor_embalagem">Preço da embalagem (R$)</label>
        <input className="campo" id="valor_embalagem" name="valor_embalagem" inputMode="decimal" defaultValue={produto?.valor_embalagem ?? ""} />
      </div>
      <div className="sm:col-span-6">
        <label className="rotulo" htmlFor="fornecedor_id">Fornecedor</label>
        <select className="campo" id="fornecedor_id" name="fornecedor_id" defaultValue={produto?.fornecedor_id ?? ""}>
          <option value="">Sem fornecedor</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
      </div>
    </>
  );
}
