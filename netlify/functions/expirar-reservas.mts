// Tarefa agendada da Netlify: uma vez por dia chama a rota que limpa reservas vencidas
// e cancela as cobranças Pix que não foram pagas (src/app/api/cron/expirar/route.ts).
// A Netlify só roda tarefas agendadas no site publicado, não em prévias.
export default async function expirarReservas() {
  const site = process.env.URL;
  const segredo = process.env.CRON_SECRET;
  if (!site || !segredo) {
    console.error("Faltam URL ou CRON_SECRET nas variáveis da Netlify");
    return;
  }
  const resposta = await fetch(`${site}/api/cron/expirar`, { headers: { authorization: `Bearer ${segredo}` } });
  console.log("Limpeza de reservas:", resposta.status, await resposta.text());
}

// 06:00 UTC = 03:00 em Brasília, fora do horário do salão.
export const config = { schedule: "0 6 * * *" };
