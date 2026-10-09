import { exigirEquipe } from "@/lib/auth/sessao";
import { BUCKET_ANTES_DEPOIS } from "@/lib/antes-depois";
import { apagarAntesDepois, moverAntesDepois, salvarAntesDepois } from "./actions";
import { BotaoApagar } from "./BotaoApagar";
import { FormEnvio } from "./FormEnvio";

type Registro = { id: string; antes_caminho: string; depois_caminho: string; servico: string; legenda: string | null; ativo: boolean };

// Antes e depois das clientes que aparecem na home. Funcionárias e gerente.
export default async function Fotos() {
  const { supabase } = await exigirEquipe();
  const { data } = await supabase
    .from("antes_depois")
    .select("id, antes_caminho, depois_caminho, servico, legenda, ativo")
    .order("ordem")
    .order("criado_em", { ascending: false });
  const lista = (data ?? []) as Registro[];
  const url = (caminho: string) => supabase.storage.from(BUCKET_ANTES_DEPOIS).getPublicUrl(caminho).data.publicUrl;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo text-4xl">fotos de antes e depois</h1>
        <p className="mt-2 max-w-2xl text-terra/85">
          Elas aparecem na home do site, na ordem desta lista. Quem visita vê primeiro o depois; o antes só aparece enquanto a pessoa mexe na foto, e some
          quando ela solta. Enquanto a lista estiver vazia, o site mostra desenhos provisórios.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="titulo text-2xl">publicar novas fotos</h2>
        <FormEnvio />
        <p className="text-xs text-terra/85">Dica: tire as duas fotos do mesmo ângulo e com a mesma luz. Fotos em pé (retrato) ficam melhores.</p>
      </section>

      <section className="space-y-3">
        <h2 className="titulo text-2xl">no site agora</h2>
        {lista.length === 0 && <p className="cartao text-terra/85">Nenhuma foto publicada ainda.</p>}
        <ul className="space-y-3">
          {lista.map((t, i) => (
            <li key={t.id} className={`cartao flex flex-wrap items-center gap-4 ${t.ativo ? "" : "opacity-60"}`}>
              <div className="flex gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url(t.antes_caminho)} alt="Antes" className="h-24 w-20 rounded-xl object-cover" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url(t.depois_caminho)} alt="Depois" className="h-24 w-20 rounded-xl object-cover ring-2 ring-folha" />
              </div>
              <form action={salvarAntesDepois} className="flex flex-1 flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={t.id} />
                <div className="min-w-48 flex-1">
                  <label className="rotulo">Serviço</label>
                  <input className="campo" name="servico" defaultValue={t.servico} maxLength={80} required />
                </div>
                <div className="min-w-48 flex-1">
                  <label className="rotulo">Legenda</label>
                  <input className="campo" name="legenda" defaultValue={t.legenda ?? ""} maxLength={120} />
                </div>
                <label className="flex items-center gap-2 pb-3 text-sm">
                  <input type="checkbox" name="ativo" defaultChecked={t.ativo} className="accent-folha-escura" />
                  Mostrar no site
                </label>
                <button className="botao-secundario py-2 text-sm">Salvar</button>
              </form>
              <div className="flex gap-1">
                {(["subir", "descer"] as const).map((d) => (
                  <form key={d} action={moverAntesDepois}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="direcao" value={d} />
                    <button
                      className="rounded-full px-3 py-2 text-sm hover:bg-areia disabled:opacity-30"
                      disabled={d === "subir" ? i === 0 : i === lista.length - 1}
                      aria-label={d === "subir" ? "Subir na lista" : "Descer na lista"}
                    >
                      {d === "subir" ? "↑" : "↓"}
                    </button>
                  </form>
                ))}
                <form action={apagarAntesDepois}>
                  <input type="hidden" name="id" value={t.id} />
                  <BotaoApagar />
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
