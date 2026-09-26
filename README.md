# Carol Rios Curly Studio: site + Curly Care

Site público do salão e sistema de agendamento, clientes e equipe.
Escopo completo em `planejamento/curly-studio-brief.md` (pasta do projeto no Claude); esta é a **fase 1**.

## O que tem na fase 1

- **Site:** início, quem somos, serviços (vêm do cadastro), contato com mapa, política de privacidade.
- **Cliente:** cria conta com e-mail e senha ou pelo Google (com CPF, exigido pelo Pix), escolhe serviço, dia, horário e profissional.
- **Sinal por Pix obrigatório:** ao escolher o horário, o site gera um QR code Pix com o valor do sinal. Dois jeitos:
  - **Pix na chave da Carol (padrão, sem taxa):** o horário fica reservado por 30 minutos. A cliente paga, toca em "Já paguei" e o WhatsApp do salão abre com a mensagem pronta para mandar o comprovante. A partir daí o horário fica guardado até a equipe conferir no banco e apertar "Confirmar sinal" na agenda do painel.
  - **Asaas (opcional):** o horário fica reservado por 15 minutos e o agendamento é confirmado sozinho quando o Pix cai (webhook do Asaas).

  Se o tempo acabar sem pagamento nem aviso, o horário volta a ficar livre.
- **Minha conta:** próximos horários, pagar sinal pendente, remarcar, cancelar, editar dados.
- **Painel da equipe (`/equipe`):** agenda do dia, cadastro de cliente na chegada, agendamento no balcão (sinal recebido no salão), serviços e valores. A gerente também cadastra a equipe e cria os logins.
- **Estoque (`/equipe/estoque`):** produtos medidos em ml, g ou unidades, com entrada por embalagem, saída, contagem e histórico. Aviso de estoque baixo no menu quando o produto chega ao mínimo (10% do estoque atual, arredondado para cima, ou valor definido à mão). Fornecedores com link para WhatsApp. Em **Consumo por serviço** a equipe informa quanto cada serviço gasta de cada produto por tamanho de cabelo (P/M/G/GG); ao concluir o atendimento na agenda, o estoque baixa sozinho. O botão "?" ao lado do título abre o guia de uso.

Textos do site ficam em `src/conteudo/salao.ts`; tudo marcado com `[PREENCHER]` precisa do conteúdo real.

## Stack

Next.js 16 (App Router) + Supabase (Postgres, login e regras de acesso) + Netlify. Pix na chave da Carol (ou pelo Asaas, se ativado).

## Rodar localmente

```bash
npm install
npx supabase start          # precisa de Docker; aplica supabase/migrations e supabase/seed.sql
cp .env.example .env.local  # preencha com as chaves que o comando acima mostra
npm run dev
```

Sem `ASAAS_API_KEY` nem `PIX_CHAVE`, a tela do Pix mostra um botão "Simular pagamento do sinal". Com só `PIX_CHAVE`, o site usa o Pix manual.

Testes: `npm test` (horários livres, CPF) e `npm run test:db` (reserva, sinal, expiração e cancelamento no banco).

## Colocar no ar

1. **Supabase:** crie o projeto (plano gratuito), rode `npx supabase link` e `npx supabase db push`. Depois rode uma vez `supabase/dados/tabela-de-servicos.sql` no SQL Editor (a tabela de serviços do salão). Em Authentication > URL Configuration, coloque a URL do site em *Site URL* e em *Redirect URLs*.
2. **Primeira gerente:** a Carol cria a conta pelo site e depois, no SQL Editor do Supabase:
   ```sql
   update usuarios set perfil = 'gerente' where id = (select id from auth.users where email = 'EMAIL_DA_CAROL');
   insert into funcionarias (usuario_id, nome, cargo) select id, 'Carol Rios', 'gerente' from auth.users where email = 'EMAIL_DA_CAROL';
   ```
   A partir daí ela cadastra a equipe e os serviços pelo painel.
3. **Pix:** preencha `PIX_CHAVE` com a chave Pix da Carol (e confira `PIX_NOME` e `PIX_CIDADE`). Faça um agendamento de teste e pague o sinal de verdade para conferir que o valor cai na conta dela. **Asaas (opcional, só se um dia quiserem confirmação automática):** conta no nome da Carol. Gere a chave de API e cadastre o webhook de cobranças apontando para `https://SEU_SITE/api/asaas/webhook`, com o mesmo token de `ASAAS_WEBHOOK_TOKEN` e os eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`. Teste primeiro no sandbox.
4. **Netlify:** em *Add new project > Import an existing project*, escolha o repositório no GitHub. As configurações de build já estão em `netlify.toml`. Em *Project configuration > Environment variables*, preencha as variáveis de `.env.example` (as de Supabase, `PIX_CHAVE`, `PIX_NOME`, `PIX_CIDADE` e `CRON_SECRET`; as do Asaas só se ele for usado) e publique. Cada `git push` na `main` publica uma versão nova.
5. **Login com Google (opcional):** no [Google Cloud Console](https://console.cloud.google.com/), crie um projeto, configure a *tela de consentimento OAuth* (nome "Carol Rios Curly Studio", tipo externo) e crie uma credencial *ID do cliente OAuth* do tipo *Aplicativo da Web*. Em *URIs de redirecionamento autorizados*, coloque `https://SEU_PROJETO.supabase.co/auth/v1/callback` (aparece no Supabase em Authentication > Sign In / Providers > Google). Cole o *Client ID* e o *Client Secret* no Supabase, nessa mesma tela, e ative o Google. Em Authentication > URL Configuration, inclua `https://SEU_SITE/auth/callback` em *Redirect URLs*. Quem entra pelo Google completa telefone e CPF na primeira vez.
6. **Limpeza diária:** a tarefa agendada `netlify/functions/expirar-reservas.mts` roda sozinha às 03:00 (Brasília) no site publicado. Ela aparece em *Logs > Functions* no painel da Netlify.

**Plano grátis da Netlify:** 300 créditos por mês. Cada publicação gasta 15 e cada GB de tráfego gasta 20. Se acabar, o site pausa até o mês seguinte (não há cobrança). Junte os ajustes e publique poucas vezes.
