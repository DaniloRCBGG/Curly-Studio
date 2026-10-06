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

1. **Supabase:** crie o projeto (plano gratuito), rode `npx supabase link` e `npx supabase db push`. Depois rode uma vez `supabase/dados/tabela-de-servicos.sql` no SQL Editor (a tabela de serviços do salão). Em Authentication > URL Configuration, coloque a URL do site em *Site URL* e `https://SEU_SITE/**` em *Redirect URLs* (o link de "Esqueci minha senha" volta em `/auth/callback`).
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
7. **Backup do banco:** configure os dois secrets da seção abaixo. Sem eles, a tarefa de backup só avisa que não está configurada.

### Segurança antes de abrir para as clientes

No painel do Supabase (valem só para o projeto no ar; o `supabase/config.toml` é só para o computador):

- **Authentication > Sign In / Providers > Email:** *Confirm email* ligado. Sem isso, qualquer pessoa cria conta com o e-mail de outra e, se houver ficha do balcão com esse e-mail, a conta fica ligada a ela. A ficha só é criada (ou ligada à do balcão) quando a cliente clica no link.
- **Authentication > Sign In / Providers > Email:** senha mínima de 8 caracteres e *Prevent use of leaked passwords* (se o plano permitir).
- **Authentication > Attack Protection:** ligar o CAPTCHA (Cloudflare Turnstile é grátis) quando o site estiver no ar, para robôs não criarem contas em massa. Precisa de um ajuste no formulário de cadastro.
- **Nunca** colocar `SUPABASE_SERVICE_ROLE_KEY` em variável que comece com `NEXT_PUBLIC_`, nem `PIX_SIMULADO=1` no site real.
- **Pix manual:** antes de apertar *Confirmar sinal*, conferir no app do banco que o valor caiu. Print de comprovante pode ser falso.

**Plano grátis da Netlify:** 300 créditos por mês. Cada publicação gasta 15 e cada GB de tráfego gasta 20. Se acabar, o site pausa até o mês seguinte (não há cobrança). Junte os ajustes e publique poucas vezes.

## Backup do banco

O plano grátis do Supabase não guarda backups para baixar. Por isso o GitHub faz um backup **domingo e quarta, às 03:00 de Brasília** (`.github/workflows/backup-banco.yml`, que roda `scripts/backup-banco.sh`).

- **O que vai no backup:** a estrutura do banco (tabelas, regras de acesso, funções), os logins de clientes e equipe e todos os dados do salão. Um arquivo `.tar.gz.gpg` por execução.
- **Onde fica:** em *Actions > Backup do banco*, na execução do dia, em *Artifacts*. O GitHub apaga cada arquivo depois de 90 dias, então sempre há os últimos três meses (uns 26 backups). Não vai para dentro do código: o que entra no histórico do git não sai mais, e a LGPD exige poder apagar os dados de uma cliente que pedir.
- **Por que é criptografado:** o backup tem nome, telefone, CPF e endereço das clientes. Sem a senha (`BACKUP_SENHA`) o arquivo não abre, nem para quem tiver acesso ao GitHub.
- **Custo:** zero. O repositório privado tem, no plano grátis, 2.000 minutos de Actions por mês e 500 MB para guardar arquivos; cada backup leva uns 2 minutos e ocupa poucos KB.
- **Se falhar:** o GitHub manda e-mail para quem alterou a agenda do backup por último.

### Configurar (uma vez, depois de criar o Supabase)

1. **Connection string:** no Supabase, clique em *Connect* no topo do projeto e copie a de **Session pooler** (a *Direct connection* não funciona no GitHub, que não tem IPv6). Troque `[YOUR-PASSWORD]` pela senha do banco.
2. **Senha do backup:** crie uma senha longa (ex.: 5 palavras aleatórias) e guarde num gerenciador de senhas da Carol, **fora do GitHub**. Sem ela nenhum backup abre, e ela não pode ser recuperada.
3. **Secrets no GitHub:** em *Settings > Secrets and variables > Actions > New repository secret*, crie `SUPABASE_DB_URL` (a connection string) e `BACKUP_SENHA` (a senha do backup).
4. **Testar:** em *Actions > Backup do banco > Run workflow*. Em uns 2 minutos o arquivo aparece em *Artifacts*.

A agenda só vale para o que está na `main`: o backup automático começa quando este arquivo estiver lá.

### Restaurar

Baixe o arquivo em *Artifacts* (vem dentro de um `.zip`), descompacte e abra com a senha:

```bash
BACKUP_SENHA='a senha' scripts/abrir-backup.sh curly-studio-AAAA-MM-DD_HHMM.tar.gz.gpg
```

Para recuperar tudo, crie um projeto **novo** no Supabase e, com a connection string dele em `URL`:

```bash
cd curly-studio-AAAA-MM-DD_HHMM
psql "$URL" -v ON_ERROR_STOP=1 -f 1-estrutura.sql
psql "$URL" -v ON_ERROR_STOP=1 -c "set session_replication_role = replica" -f 2-contas.sql -f 3-dados.sql
```

Depois troque as chaves do Supabase nas variáveis da Netlify e refaça o passo 5 (Google), se ele estiver ativo. Apague a pasta aberta ao terminar: ali os dados ficam sem criptografia.
