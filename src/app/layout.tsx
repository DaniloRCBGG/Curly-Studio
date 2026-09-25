import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { salao } from "@/conteudo/salao";
import "./globals.css";

// Alifira e Altone (fontes da marca) exigem licença de webfont; Fraunces e Outfit são os substitutos gratuitos do guia.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: { default: salao.nome, template: `%s | ${salao.nome}` },
  description: salao.subchamada,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans font-light">{children}</body>
    </html>
  );
}
