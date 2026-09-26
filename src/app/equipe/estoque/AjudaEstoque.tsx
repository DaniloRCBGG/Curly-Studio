"use client";

import { useRef, type ReactNode } from "react";

// Guia de uso do estoque, aberto pelo botão "?" ao lado do título.
// Texto aprovado pelo Danilo no documento "Como usar o estoque" (26/09/2026).

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="titulo text-2xl">{titulo}</h3>
      {children}
    </section>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-terra/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-areia/50">
          <tr>
            {cabecalho.map((c) => (
              <th key={c} className="px-3 py-2 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-terra/10">
          {linhas.map((l) => (
            <tr key={l[0]}>
              {l.map((c, i) => (
                <td key={i} className="px-3 py-2 align-top">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AjudaEstoque() {
  const dialogo = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        aria-label="Como usar o estoque"
        title="Como usar o estoque"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-terra/30 text-lg font-medium text-terra transition hover:border-folha-escura hover:bg-folha-escura hover:text-areia-clara focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-folha-escura"
      >
        ?
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby="ajuda-estoque-titulo"
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="m-auto max-h-[90vh] w-[min(48rem,calc(100vw-2rem))] rounded-2xl bg-areia-clara p-0 text-terra shadow-xl backdrop:bg-terra/40"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-terra/10 bg-areia-clara px-6 py-4">
          <h2 id="ajuda-estoque-titulo" className="titulo text-3xl">como usar o estoque</h2>
          <button type="button" onClick={() => dialogo.current?.close()} className="botao-secundario px-4 py-2 text-sm">
            Fechar
          </button>
        </div>
        <div className="space-y-8 px-6 py-6 leading-relaxed">
          <Secao titulo="visão geral">
            <p>
              O estoque fica na aba <strong>Estoque</strong> do painel da equipe, e qualquer funcionária ou a gerente pode usar. Lá aparece cada
              produto com quanto tem, o mínimo e a situação: <strong>ok</strong>, <strong>repor</strong> ou <strong>acabou</strong>.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Como o sistema mede:</strong> cada produto é medido em ml (líquidos), g (cremes e pós) ou unidades (toucas, luvas). O
                sistema faz as contas nessa medida e mostra também quantas embalagens isso dá, por exemplo &quot;1,85 L · 3,7 embalagens&quot;.
              </li>
              <li>
                <strong>Embalagem:</strong> é o que vocês compram, como um frasco de 500 ml ou um pote de 1 kg. Na hora de registrar uma compra, é
                só dizer quantas embalagens chegaram.
              </li>
              <li>
                <strong>Aviso de repor:</strong> quando um produto chega ao mínimo, aparece um número ao lado de <strong>Estoque</strong> no menu e
                um aviso amarelo no topo da aba. O botão <strong>Ver só esses</strong> mostra apenas o que precisa comprar.
              </li>
              <li>
                <strong>Mínimo:</strong> por padrão é 10% do total em estoque, arredondado para cima, e é recalculado a cada compra registrada.
                Também dá para definir à mão (veja &quot;Editar e remover produto&quot;).
              </li>
            </ul>
          </Secao>

          <Secao titulo="cadastrar produto">
            <p>
              Na aba <strong>Estoque</strong>, abra <strong>cadastrar produto</strong> no fim da página, preencha e clique em{" "}
              <strong>Cadastrar produto</strong>.
            </p>
            <Tabela
              cabecalho={["Campo", "O que colocar", "Exemplo"]}
              linhas={[
                ["Nome", "Como a equipe chama o produto", "Máscara de hidratação"],
                ["Marca", "Opcional; ajuda a diferenciar produtos parecidos", "Lola"],
                ["Medido em", "ml para líquidos, g para cremes e pós, unidades para itens contados", "g"],
                ["Quanto vem na embalagem", "O conteúdo de uma embalagem, na medida escolhida", "1000 (pote de 1 kg)"],
                ["Preço da embalagem", "Opcional; quanto costuma custar", "89,90"],
                ["Fornecedor", "De quem vocês compram; cadastre antes em Fornecedores", "Distribuidora Cachos"],
                ["Quanto já tem no salão", "O que já está na prateleira hoje, em embalagens ou em ml/g/unidades", "3 embalagens"],
              ]}
            />
            <p>
              Depois de cadastrar, o sistema abre a página do produto. O que já existia no salão entra no histórico como{" "}
              <strong>Estoque inicial</strong>.
            </p>
            <p>Dica: se sobrou meio frasco, dá para escrever 0,5 embalagem ou trocar para ml e colocar o valor exato.</p>
          </Secao>

          <Secao titulo="atualizar o estoque">
            <p>Clique no nome do produto na lista. A página dele tem três quadros, um para cada situação, e o histórico logo abaixo.</p>
            <Tabela
              cabecalho={["Quadro", "Quando usar", "O que acontece", "Exemplo"]}
              linhas={[
                ["Chegou produto", "Chegou uma compra ou reposição", "Soma ao estoque e recalcula o mínimo", "Chegaram 2 potes; valor pago R$ 179,80"],
                ["Usei ou saiu", "Uso em atendimento, perda, produto vencido ou quebrado", "Tira do estoque", "Saíram 150 g nas hidratações da semana"],
                ["Contei o estoque", "Contou a prateleira e o número não bate com o sistema", "Troca o saldo pelo total contado e guarda a diferença", "Tem 1.100 g de verdade"],
              ]}
            />
            <p>Em cada quadro:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Digite a quantidade.</li>
              <li>
                Escolha se ela está em <strong>embalagens</strong> ou em ml, g ou unidades.
              </li>
              <li>Se quiser, escreva uma observação, como &quot;frasco caiu&quot; ou &quot;contagem de sábado&quot;.</li>
              <li>Clique no botão do quadro. Aparece &quot;Salvo.&quot; e o histórico ganha uma linha nova.</li>
            </ol>
            <p>O sistema não deixa tirar mais do que tem. Se isso acontecer, provavelmente o saldo está errado: faça uma contagem.</p>
            <p>
              O valor pago em <strong>Chegou produto</strong> é opcional. Vale preencher, porque ele vai servir para o controle de entradas e
              saídas de dinheiro mais adiante.
            </p>
            <p>Sugestão de rotina: registrar as saídas no fim do dia e fazer uma contagem completa uma vez por semana, nos horários sem atendimento.</p>
          </Secao>

          <Secao titulo="editar e remover produto">
            <p>
              Na página do produto, abra <strong>editar produto</strong> no fim, mude o que precisar e clique em <strong>Salvar</strong>. Dá para
              mudar nome, marca, medida, tamanho e preço da embalagem e fornecedor. A quantidade em estoque não muda por aqui: use os quadros de
              cima.
            </p>
            <p>
              <strong>Estoque mínimo à mão.</strong> Marque <strong>Definir à mão</strong>, escreva o mínimo e salve. A partir daí as compras não
              mudam mais esse valor. Para voltar aos 10% automáticos, desmarque e salve.
            </p>
            <p>
              <strong>Remover produto.</strong> O sistema não apaga produtos, para não perder o histórico do que foi comprado e usado. Quando o
              salão deixar de usar um produto, desmarque <strong>Ativo</strong> e salve. Ele vai para o fim da lista, em cinza, e deixa de gerar
              aviso de repor. Para voltar a usar, marque <strong>Ativo</strong> de novo.
            </p>
            <p>Se cadastrou um produto por engano, desative e crie o certo.</p>
          </Secao>

          <Secao titulo="baixa automática por serviço">
            <p>
              Quando um atendimento é marcado como <strong>concluído</strong> na agenda, o sistema tira do estoque, sozinho, os produtos que
              aquele serviço gasta. Para isso, cada serviço precisa ter o consumo cadastrado.
            </p>
            <p>
              <strong>Cadastrar o consumo de um serviço:</strong>
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Na aba <strong>Estoque</strong>, clique em <strong>Consumo por serviço</strong>.
              </li>
              <li>Clique no nome do serviço, por exemplo Hidratação.</li>
              <li>
                Em <strong>Adicionar produto</strong>, escolha o produto e preencha quanto ele gasta em cada tamanho de cabelo (P, M, G e GG), na
                medida do produto (ml, g ou unidades).
              </li>
              <li>
                Clique em <strong>Salvar consumo</strong>. Para incluir outro produto no mesmo serviço, repita os passos 3 e 4.
              </li>
            </ol>
            <Tabela
              cabecalho={["Produto", "Cabelo P", "Cabelo M", "Cabelo G", "Cabelo GG"]}
              linhas={[
                ["Máscara de hidratação (g)", "20", "40", "60", "90"],
                ["Touca térmica (unidades)", "1", "1", "1", "1"],
              ]}
            />
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Gasto igual em todos os tamanhos:</strong> repita o mesmo número nas quatro colunas, como na touca do exemplo.
              </li>
              <li>
                <strong>Ajustar:</strong> mude os números e salve. Vale para os próximos atendimentos; os já concluídos não mudam.
              </li>
              <li>
                <strong>Tirar um produto do serviço:</strong> apague os números dele e salve.
              </li>
              <li>
                <strong>Atendimento sem tamanho de cabelo:</strong> o sistema usa a coluna M.
              </li>
              <li>
                <strong>Estoque não dá:</strong> o atendimento é concluído mesmo assim, o produto fica zerado e o histórico mostra &quot;estoque
                não dava: conferir&quot;. Faça uma contagem.
              </li>
            </ul>
            <p>
              No histórico do produto, essas saídas aparecem como <strong>baixa automática</strong>, com o nome do serviço e o tamanho. O que o
              serviço não prevê (um frasco que caiu, um produto extra) continua indo em <strong>Usei ou saiu</strong>.
            </p>
          </Secao>

          <Secao titulo="fornecedores">
            <p>
              Na aba <strong>Estoque</strong>, clique em <strong>Fornecedores</strong> no canto de cima.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Cadastrar:</strong> preencha nome, telefone ou WhatsApp, e-mail e observação (por exemplo, &quot;entrega às quintas&quot;) e
                clique em <strong>Adicionar fornecedor</strong>.
              </li>
              <li>
                <strong>Falar com o fornecedor:</strong> o link <strong>WhatsApp</strong> ao lado do nome abre a conversa direto.
              </li>
              <li>
                <strong>Editar:</strong> clique no nome do fornecedor, altere e clique em <strong>Salvar</strong>.
              </li>
              <li>
                <strong>Remover:</strong> como nos produtos, desmarque <strong>Ativo</strong>. Ele some da lista de escolha no cadastro de produtos,
                mas o histórico fica.
              </li>
            </ul>
          </Secao>

          <Secao titulo="dúvidas comuns">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Registrei errado, como desfaço?</strong> Faça o movimento contrário (uma saída para desfazer uma entrada, e vice-versa) com
                a observação &quot;correção&quot;. Ou use <strong>Contei o estoque</strong> com o valor certo. O histórico não é apagado, para ficar
                claro o que aconteceu.
              </li>
              <li>
                <strong>Por que o mínimo mudou sozinho?</strong> Porque ele é 10% do total e é recalculado a cada compra. Se preferir um número
                fixo, defina à mão.
              </li>
              <li>
                <strong>O estoque baixa sozinho quando termino um atendimento?</strong> Sim, se o consumo do serviço estiver cadastrado (veja
                &quot;Baixa automática por serviço&quot;). Sem cadastro, nada é descontado; registre em <strong>Usei ou saiu</strong>.
              </li>
              <li>
                <strong>Quem mexeu no estoque?</strong> Cada linha do histórico guarda quem registrou e quando.
              </li>
            </ul>
          </Secao>
        </div>
      </dialog>
    </>
  );
}
