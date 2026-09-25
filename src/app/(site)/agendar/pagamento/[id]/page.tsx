import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AguardandoPix } from "@/components/AguardandoPix";
import { formatarData, formatarHora } from "@/lib/agenda/horarios";
import { exigirLogin } from "@/lib/auth/sessao";
import { cancelarCobrancaPix, pixSimulado } from "@/lib/pagamentos/pix";
import { reais } from "@/lib/servicos";

export const metadata: Metadata = { title: "Pagamento do sinal" };

type Agendamento = {
  id: string;
  inicio: string;
  status: string;
  expira_em: string | null;
  servicos: { nome: string };
  funcionarias: { nome: string };
  sinais: { valor: number; status: string; pix_copia_e_cola: string | null; pix_qr_code_base64: string | null; provedor_cobranca_id: string | null } | null;
};

export default async function Pagamento({ params }: PageProps<"/agendar/pagamento/[id]">) {
  const { id } = await params;
  const { supabase } = await exigirLogin(`/agendar/pagamento/${id}`);
  const { data } = await supabase
    .from("agendamentos")
    .select("id, inicio, status, expira_em, servicos(nome), funcionarias(nome), sinais(valor, status, pix_copia_e_cola, pix_qr_code_base64, provedor_cobranca_id)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const ag = data as unknown as Agendamento;

  const vencido = ag.status === "expirado" || (ag.status === "aguardando_sinal" && ag.expira_em !== null && new Date(ag.expira_em) < new Date());
  if (vencido && ag.sinais?.provedor_cobranca_id && ag.sinais.status !== "pago") {
    await cancelarCobrancaPix(ag.sinais.provedor_cobranca_id);
  }

  const resumo = `${ag.servicos.nome} com ${ag.funcionarias.nome}, ${formatarData(ag.inicio)} às ${formatarHora(ag.inicio)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {ag.status === "agendado" ? (
        <div className="cartao text-center">
          <h1 className="titulo text-5xl">agendado!</h1>
          <p className="mt-4 text-lg">{resumo}</p>
          <p className="mt-2 text-terra/75">Recebemos seu sinal. Até lá!</p>
          <Link href="/minha-conta" className="botao mt-8">
            Ver meus agendamentos
          </Link>
        </div>
      ) : vencido ? (
        <div className="cartao text-center">
          <h1 className="titulo text-4xl">o tempo para pagar acabou</h1>
          <p className="mt-4 text-terra/75">
            O horário foi liberado porque o Pix não foi pago a tempo. Se você pagou agora há pouco, fale com o salão pelo WhatsApp que a gente resolve.
          </p>
          <Link href="/agendar" className="botao mt-8">
            Escolher outro horário
          </Link>
        </div>
      ) : ag.status === "aguardando_sinal" && ag.sinais ? (
        <div className="cartao">
          <h1 className="titulo text-4xl">pague o sinal para confirmar</h1>
          <p className="mt-3">{resumo}</p>
          <p className="mt-1 text-terra/75">Sinal: {reais(Number(ag.sinais.valor))}</p>
          {ag.sinais.pix_qr_code_base64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${ag.sinais.pix_qr_code_base64}`}
              alt="QR code do Pix do sinal"
              width={240}
              height={240}
              className="mx-auto my-6 rounded-xl bg-white p-2"
            />
          )}
          <AguardandoPix agendamentoId={ag.id} expiraEm={ag.expira_em!} copiaECola={ag.sinais.pix_copia_e_cola ?? ""} simulado={pixSimulado()} />
        </div>
      ) : (
        <div className="cartao text-center">
          <h1 className="titulo text-4xl">agendamento {ag.status}</h1>
          <Link href="/minha-conta" className="botao mt-8">
            Ver meus agendamentos
          </Link>
        </div>
      )}
    </div>
  );
}
