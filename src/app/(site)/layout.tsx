import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";

export default function LayoutSite({ children }: LayoutProps<"/">) {
  return (
    <>
      <Cabecalho />
      <main className="flex-1">{children}</main>
      <Rodape />
    </>
  );
}
