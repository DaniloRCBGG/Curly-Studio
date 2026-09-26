# Carol Rios Curly Studio: site + Curly Care

Site público do salão e sistema de agendamento, clientes e equipe.
Escopo completo em `planejamento/curly-studio-brief.md` (pasta do projeto no Claude); esta é a **fase 1**.

## O que tem na fase 1

- **Site:** início, quem somos, serviços (vêm do cadastro), contato com mapa, política de privacidade.
- **Cliente:** cria conta (com CPF, exigido pelo Pix), escolhe serviço, dia, horário e profissional.
- **Sinal por Pix obrigatório:** ao escolher o horário, o site gera um QR code Pix. O horário fica reservado por 15 minutos e o agendamento só é confirmado quando o Pix cai (webhook do Asaas). Se o tempo acabar, o horário volta a ficar livre.
- **Minha conta:** próximos horários, pagar sinal pendente, remarcar, cancelar, editar dados.
- **Painel da equipe (`/equipe`):** agenda do dia, cadastro de cliente na chegada, agendamento no balcão (sinal recebido no salão), serviços e valores. A gerente também cadastra a equipe e cria os logins.
- **Estoque (`/equipe/estoque`):** produtos medidos em ml, g ou unidades, com entrada por embalagem, saída, contagem e histórico. Aviso de estoque baixo no menu quando o produto chega ao mínimo (10% do estoque atual, arredondado para cima, ou valor definido à mão). Fornecedores com link para WhatsApp. A baixa automática por atendimento entra junto com o registro de atendimento.

Textos do site ficam em `src/conteudo/salao.ts`; tudo marcado com `[PREENCHER]` precisa do conteúdo real.

## Stack

Next.js 16 (App Router) + Supabase (Postgres, login e regras de acesso) + Vercel. Pix pelo Asaas.

## Rodar localmente

```bash
npm install
npx supabase start          # precisa de Docker; aplica supabase/migrations e supabase/seed.sql
cp .env.example .env.local  # preencha com as chaves que o comando acima mostra
npm run dev
```

Sem `ASAAS_API_KEY`, a tela do Pix mostra um botão "Simular pagamento do sinal".

Testes: `npm test` (horários livres, CPF) e `npm run test:db` (reserva, sinal, expiração e cancelamento no banco).

## Colocar no ar

1. **Supabase:** crie o projeto (plano gratuito), rode `npx supabase link` e `npx supabase db push`. Em Authentication > URL Configuration, coloque a URL do site.
2. **Primeira gerente:** a Carol cria a conta pelo site e depois, no SQL Editor do Supabase:
   ```sql
   update usuarios set perfil = 'gerente' where id = (select id from auth.users where email = 'EMAIL_DA_CAROL');
   insert into funcionarias (usuario_id, nome, cargo) select id, 'Carol Rios', 'gerente' from auth.users where email = 'EMAIL_DA_CAROL';
   ```
   A partir daí ela cadastra a equipe e os serviços pelo painel.
3. **Asaas:** conta no nome da Carol. Gere a chave de API e cadastre o webhook de cobranças apontando para `https://SEU_SITE/api/asaas/webhook`, com o mesmo token de `ASAAS_WEBHOOK_TOKEN` e os eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`. Teste primeiro no sandbox.
4. **Vercel:** importe o repositório, preencha as variáveis de `.env.example` e publique. A limpeza diária de reservas vencidas já está em `vercel.json`.
