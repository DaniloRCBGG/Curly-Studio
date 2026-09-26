"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  agendamentoId: string;
  expiraEm: string;
  copiaECola: string;
  modo: "asaas" | "manual" | "simulado";
  informado: boolean; // Pix manual: a cliente já tocou em "Já paguei"
  whatsappComprovante: string;
};

// Mostra o tempo restante e consulta o status até o Pix ser confirmado.
export function AguardandoPix({ agendamentoId, expiraEm, copiaECola, modo, informado, whatsappComprovante }: Props) {
  const router = useRouter();
  const [restante, setRestante] = useState(() => new Date(expiraEm).getTime() - Date.now());
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const relogio = setInterval(() => setRestante(new Date(expiraEm).getTime() - Date.now()), 1000);
    const consulta = setInterval(async () => {
      const resposta = await fetch(`/api/agendamentos/${agendamentoId}/status`, { cache: "no-store" });
      if (!resposta.ok) return;
      const { status } = (await resposta.json()) as { status: string };
      if (status !== "aguardando_sinal") router.refresh();
    }, 4000);
    return () => {
      clearInterval(relogio);
      clearInterval(consulta);
    };
  }, [agendamentoId, expiraEm, router]);

  useEffect(() => {
    if (restante <= 0 && !informado) router.refresh();
  }, [restante <= 0, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const minutos = Math.max(0, Math.floor(restante / 60000));
  const segundos = Math.max(0, Math.floor((restante % 60000) / 1000));

  async function copiar() {
    await navigator.clipboard.writeText(copiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  // O link abre o WhatsApp; o aviso ao site vai junto, sem segurar a navegação.
  function avisarPagamento() {
    fetch(`/api/agendamentos/${agendamentoId}/informar-pagamento`, { method: "POST", keepalive: true }).then(() => router.refresh());
  }

  async function simularPagamento() {
    await fetch("/api/pix-simulado/pagar", { method: "POST", body: JSON.stringify({ agendamentoId }) });
    router.refresh();
  }

  if (informado) {
    return (
      <div className="mt-6 space-y-4">
        <p aria-live="polite">
          Recebemos seu aviso. Assim que o salão conferir o Pix, seu horário fica confirmado e esta página atualiza sozinha.
        </p>
        <p className="text-sm text-terra/75">
          Ainda não mandou o comprovante?{" "}
          <a href={whatsappComprovante} target="_blank" rel="noopener" className="font-medium text-folha-escura underline underline-offset-4">
            Enviar pelo WhatsApp
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-terra/75" aria-live="polite">
        Seu horário fica reservado por mais{" "}
        <strong className="font-medium text-terra">
          {minutos}:{String(segundos).padStart(2, "0")}
        </strong>
        .{" "}
        {modo === "manual"
          ? "Pague o Pix no app do seu banco e depois toque em “Já paguei” para mandar o comprovante."
          : "Assim que o Pix cair, esta página confirma sozinha."}
      </p>
      <div>
        <label className="rotulo" htmlFor="copia-e-cola">Pix copia e cola</label>
        <div className="flex gap-2">
          <input id="copia-e-cola" readOnly value={copiaECola} className="campo font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" onClick={copiar} className="botao-secundario shrink-0 px-4">
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>
      {modo === "manual" && (
        <a href={whatsappComprovante} target="_blank" rel="noopener" onClick={avisarPagamento} className="botao w-full justify-center">
          Já paguei, enviar comprovante
        </a>
      )}
      {modo === "simulado" && (
        <div className="rounded-xl border border-dashed border-terra/30 p-4 text-sm">
          <p>Modo de teste: nenhum Pix real foi gerado.</p>
          <button type="button" onClick={simularPagamento} className="mt-2 font-medium text-folha-escura underline underline-offset-4">
            Simular pagamento do sinal
          </button>
        </div>
      )}
    </div>
  );
}
