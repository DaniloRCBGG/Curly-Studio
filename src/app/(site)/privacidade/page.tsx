import type { Metadata } from "next";
import { salao } from "@/conteudo/salao";

export const metadata: Metadata = { title: "Política de privacidade" };

// Texto-base para adequação à LGPD. [PREENCHER] Revisar com a Carol antes de publicar.
export default function Privacidade() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-16 text-terra/85 sm:px-6">
      <h1 className="titulo text-5xl text-terra">política de privacidade</h1>
      <p>
        O {salao.nome} coleta apenas os dados necessários para agendar e realizar seus atendimentos: nome, telefone, e-mail, CPF
        (exigido para gerar a cobrança Pix do sinal) e endereço.
      </p>
      <h2 className="titulo pt-4 text-2xl text-terra">como usamos seus dados</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Para criar sua conta, confirmar e lembrar seus agendamentos.</li>
        <li>Para gerar a cobrança do sinal por Pix, junto ao nosso parceiro de pagamentos.</li>
        <li>Para manter o histórico dos seus atendimentos no salão.</li>
        <li>Para estatísticas internas de quais regiões atendemos, sempre de forma agregada, sem identificar ninguém.</li>
      </ul>
      <h2 className="titulo pt-4 text-2xl text-terra">seus direitos</h2>
      <p>
        Você pode pedir a qualquer momento para ver, corrigir ou excluir seus dados, pelo WhatsApp {salao.contato.whatsapp} ou pelo
        e-mail {salao.contato.email}. Não vendemos nem compartilhamos seus dados para fins de publicidade.
      </p>
    </article>
  );
}
