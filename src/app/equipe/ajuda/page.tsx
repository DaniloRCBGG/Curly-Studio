import Link from "next/link";
import type { ReactNode } from "react";
import { exigirEquipe } from "@/lib/auth/sessao";

export const metadata = { title: "Como usar o painel" };

const SECOES = [
  { id: "comeco", titulo: "Primeiro acesso" },
  { id: "agenda", titulo: "Agenda do dia" },
  { id: "pix", titulo: "Sinal por Pix" },
  { id: "balcao", titulo: "Agendar pelo balcão" },
  { id: "clientes", titulo: "Clientes" },
  { id: "servicos", titulo: "Serviços e valores" },
  { id: "estoque", titulo: "Estoque" },
  { id: "equipe", titulo: "Equipe e logins" },
  { id: "site", titulo: "O que a cliente vê no site" },
];

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="cartao scroll-mt-6 space-y-3 leading-relaxed">
      <h2 className="titulo text-3xl">{titulo.toLowerCase()}</h2>
      {children}
    </section>
  );
}

function SoGerente() {
  return <span className="ml-2 rounded-full bg-areia px-2 py-0.5 align-middle text-xs font-medium text-terra">só a gerente</span>;
}

// Guia do painel para a equipe. Fica atrás do login, como o guia do estoque.
export default async function Ajuda() {
  const { perfil } = await exigirEquipe();
  const gerente = perfil === "gerente";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo text-4xl">como usar o painel</h1>
        <p className="mt-2 text-terra/75">Um passo a passo de cada parte. Os itens marcados com “só a gerente” não aparecem para o resto da equipe.</p>
      </div>

      <nav aria-label="Partes do guia" className="flex flex-wrap gap-2">
        {SECOES.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-terra/20 bg-white px-4 py-1.5 text-sm hover:border-terra">
            {s.titulo}
          </a>
        ))}
      </nav>

      <Secao id="comeco" titulo="Primeiro acesso">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Entre no site com o e-mail e a senha que a gerente passou. Você cai direto aqui no painel.</li>
          <li>
            Troque a senha provisória em <Link href="/minha-conta/senha" className="text-folha-escura underline">Trocar senha</Link>, no canto de cima.
          </li>
          <li>No celular ou num computador do salão que outras pessoas usam, toque em <strong>Sair</strong> ao terminar.</li>
        </ol>
        <p className="text-sm text-terra/75">Esqueceu a senha? Na tela de entrar, toque em “Esqueci minha senha” e siga o link que chega no e-mail.</p>
      </Secao>

      <Secao id="agenda" titulo="Agenda do dia">
        <p>
          A tela <Link href="/equipe" className="text-folha-escura underline">Agenda</Link> mostra os atendimentos do dia, em ordem de horário: serviço, quem atende, a cliente, o telefone e a situação do sinal.
          Use <strong>Dia anterior</strong>, <strong>Hoje</strong> e <strong>Próximo dia</strong> para navegar.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Concluir:</strong> aperte quando o atendimento terminar. O estoque baixa sozinho, conforme o consumo cadastrado para aquele serviço e tamanho de cabelo.
          </li>
          <li>
            <strong>Cancelar:</strong> libera o horário. A devolução do sinal, se houver, é combinada com a cliente pelo WhatsApp.
          </li>
          <li>Reservas cujo Pix não foi pago a tempo somem da agenda sozinhas e o horário volta a ficar livre.</li>
        </ul>
      </Secao>

      <Secao id="pix" titulo="Sinal por Pix">
        <p>Quem agenda pelo site paga um sinal por Pix na chave da Carol. O caminho é este:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>A cliente escolhe o horário e o site mostra o QR code. O horário fica reservado por 30 minutos.</li>
          <li>Ela paga, toca em “Já paguei” e manda o comprovante no WhatsApp do salão. Na agenda aparece “a cliente diz que pagou, confira no banco”.</li>
          <li>
            <strong>Confira no app do banco que o valor caiu</strong> e só então aperte <strong>Confirmar sinal</strong>. Print de comprovante pode ser falso.
          </li>
          <li>Pronto: o agendamento fica confirmado e a cliente vê isso em Minha conta.</li>
        </ol>
        <p className="text-sm text-terra/75">Se ela não pagar nem avisar em 30 minutos, a reserva expira e o horário volta a ficar livre.</p>
      </Secao>

      <Secao id="balcao" titulo="Agendar pelo balcão">
        <p>Para marcar um horário para quem está no salão, ligou ou mandou mensagem:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Abra <Link href="/equipe/clientes" className="text-folha-escura underline">Clientes</Link>, procure pelo nome ou telefone e toque em <strong>Agendar</strong>. Se a cliente for nova, use
            “cadastrar na chegada”.
          </li>
          <li>Escolha o serviço e, quando o preço depende do cabelo, o tamanho (P, M, G ou GG).</li>
          <li>Escolha o dia, o horário e a profissional, e toque em <strong>Agendar</strong>.</li>
        </ol>
        <p className="text-sm text-terra/75">No balcão o sinal fica registrado como recebido no salão: receba o valor antes de confirmar.</p>
      </Secao>

      <Secao id="clientes" titulo="Clientes">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Buscar:</strong> digite parte do nome, ou pelo menos 4 números do telefone.
          </li>
          <li>
            <strong>Cadastrar na chegada:</strong> nome e telefone ou e-mail (um dos dois basta). O CEP preenche o endereço sozinho. Marque a autorização dos dados só se a cliente concordou.
          </li>
          <li>
            <strong>Fichas para juntar:</strong> aparece quando alguém com ficha do balcão cria conta no site. Confirme com a cliente que é a mesma pessoa antes de tocar em <strong>Juntar</strong>: o histórico do balcão
            passa para a conta do site.
          </li>
          <li>
            <strong>Contatos para o WhatsApp</strong>
            <SoGerente />: baixa um arquivo com as clientes novas para salvar no celular do salão de uma vez.
          </li>
        </ul>
      </Secao>

      <Secao id="servicos" titulo="Serviços e valores">
        <p>
          Em <Link href="/equipe/servicos" className="text-folha-escura underline">Serviços</Link> ficam os preços que aparecem no site, na aba Valores e no agendamento. Toque num serviço para abrir e editar.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Preço por tamanho:</strong> preencha P, M, G e GG, ou deixe os quatro vazios e use o preço único.
          </li>
          <li>
            <strong>Sinal:</strong> o valor do Pix cobrado ao agendar. Ele é descontado do valor final.
          </li>
          <li>
            <strong>Duração:</strong> define quantos horários o serviço ocupa na agenda.
          </li>
          <li>
            <strong>Ativo:</strong> desmarque para tirar o serviço do site sem apagar.
          </li>
          <li>
            <strong>Quem faz</strong>
            <SoGerente />: quais profissionais aparecem para aquele serviço na hora de agendar.
          </li>
        </ul>
      </Secao>

      <Secao id="estoque" titulo="Estoque">
        <p>
          Em <Link href="/equipe/estoque" className="text-folha-escura underline">Estoque</Link> ficam os produtos, as entradas e saídas e os fornecedores. O número ao lado de “Estoque” no menu avisa quantos
          produtos estão acabando.
        </p>
        <p>Lá dentro, o botão <strong>?</strong> ao lado do título abre um guia completo do estoque, com o consumo por serviço.</p>
      </Secao>

      <Secao id="equipe" titulo="Equipe e logins">
        {gerente ? (
          <>
            <p>
              Em <Link href="/equipe/funcionarias" className="text-folha-escura underline">Equipe</Link> você cadastra quem trabalha no salão.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Cargo:</strong> gerente vê tudo, inclusive esta aba. Cabeleireira auxiliar e assistente usam agenda, balcão, clientes, serviços e estoque.
              </li>
              <li>
                <strong>Login:</strong> preencha e-mail e uma senha inicial (8 caracteres ou mais) e salve. Passe os dois para a pessoa e peça que troque a senha no primeiro acesso.
              </li>
              <li>
                <strong>Atende clientes:</strong> desmarque para quem não aparece na agenda, como recepção.
              </li>
              <li>
                <strong>Ativa:</strong> desmarque quando alguém sair do salão. O histórico fica guardado.
              </li>
              <li>Diária e comissão ficam guardadas aqui; o cálculo do pagamento ainda vai entrar no sistema.</li>
            </ul>
          </>
        ) : (
          <p>O cadastro da equipe e dos logins é feito pela gerente. Precisa trocar algum dado seu? Fale com ela.</p>
        )}
      </Secao>

      <Secao id="site" titulo="O que a cliente vê no site">
        <ul className="list-disc space-y-1 pl-5">
          <li>Cria conta com e-mail e senha (ou Google), com nome, CPF e CEP. O CPF é exigido pelo Pix.</li>
          <li>Escolhe serviço, tamanho do cabelo, dia, horário e profissional, e paga o sinal por Pix.</li>
          <li>Em Minha conta vê os próximos horários, paga um sinal pendente, remarca, cancela e atualiza os dados.</li>
          <li>Na aba Valores vê a tabela de preços e escolhe o tamanho do cabelo para ver só o que vale para ela.</li>
        </ul>
        <p className="text-sm text-terra/75">Quem é da equipe não usa a área de cliente: para marcar um horário para alguém, use o balcão.</p>
      </Secao>
    </div>
  );
}
