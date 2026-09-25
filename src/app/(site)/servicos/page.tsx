import type { Metadata } from "next";
import { ListaServicos } from "@/components/ListaServicos";
import { listarServicos } from "@/lib/servicos";

export const metadata: Metadata = { title: "Serviços" };

export default async function Servicos() {
  const servicos = await listarServicos();
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="titulo text-5xl">serviços</h1>
      <p className="mt-4 max-w-2xl text-terra/75">
        Valores de referência. Para confirmar o horário, pedimos um sinal por Pix no momento do agendamento, descontado do valor final.
      </p>
      <div className="mt-10">
        <ListaServicos servicos={servicos} />
      </div>
    </div>
  );
}
