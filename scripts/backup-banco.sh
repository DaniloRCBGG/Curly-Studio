#!/usr/bin/env bash
# Backup do banco do Supabase em um único arquivo criptografado (.tar.gz.gpg).
#
# Uso:
#   SUPABASE_DB_URL='postgresql://...' BACKUP_SENHA='...' scripts/backup-banco.sh [pasta-de-saida]
#
# O arquivo tem quatro partes, restauradas nesta ordem (ver README, "Backup do banco"):
#   1-estrutura.sql  tabelas, regras de acesso e funções (schemas public e supabase_migrations)
#   2-contas.sql     logins das clientes e da equipe (auth.users e auth.identities)
#   3-dados.sql      dados do salão (clientes, agendamentos, estoque...)
#   LEIA-ME.txt      como restaurar
# Sem a BACKUP_SENHA o arquivo não abre: guarde a senha fora do GitHub.
set -euo pipefail

: "${SUPABASE_DB_URL:?Defina SUPABASE_DB_URL (connection string do Session pooler do Supabase)}"
: "${BACKUP_SENHA:?Defina BACKUP_SENHA (senha que criptografa o backup)}"

saida="${1:-backup}"
mkdir -p "$saida"
nome="curly-studio-$(date -u +%Y-%m-%d_%H%M)"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
pasta="$tmp/$nome"
mkdir "$pasta"

esquemas=(--schema=public --schema=supabase_migrations)

# pg_dump por schema não inclui as extensões (ex.: btree_gist), então elas vão no início.
# public já existe em todo projeto Supabase; o histórico de migrações é recriado do zero.
{
  psql "$SUPABASE_DB_URL" -tA -v ON_ERROR_STOP=1 -c "
    select format('CREATE EXTENSION IF NOT EXISTS %I WITH SCHEMA %I;', e.extname, n.nspname)
    from pg_extension e join pg_namespace n on n.oid = e.extnamespace
    where e.extname <> 'plpgsql' order by 1"
  pg_dump "$SUPABASE_DB_URL" --schema-only --no-owner --schema=public \
    | sed 's/^CREATE SCHEMA public;$/CREATE SCHEMA IF NOT EXISTS public;/'
  pg_dump "$SUPABASE_DB_URL" --schema-only --no-owner --schema=supabase_migrations --clean --if-exists
  # Gatilhos nossos nas tabelas do auth (ex.: criar a ficha da cliente no cadastro).
  psql "$SUPABASE_DB_URL" -qtA -v ON_ERROR_STOP=1 -c "set search_path = ''" -c "
    select format('DROP TRIGGER IF EXISTS %I ON %s; %s;', t.tgname, t.tgrelid::regclass, pg_get_triggerdef(t.oid))
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid join pg_namespace pn on pn.oid = p.pronamespace
    where n.nspname = 'auth' and pn.nspname = 'public' and not t.tgisinternal order by 1"
} > "$pasta/1-estrutura.sql"
pg_dump "$SUPABASE_DB_URL" --data-only --no-owner --table=auth.users --table=auth.identities -f "$pasta/2-contas.sql"
pg_dump "$SUPABASE_DB_URL" --data-only --no-owner "${esquemas[@]}" -f "$pasta/3-dados.sql"

cat > "$pasta/LEIA-ME.txt" <<'TXT'
Backup do banco do Carol Rios Curly Studio.
Contém dados pessoais de clientes (LGPD): não envie por e-mail nem deixe em pasta compartilhada.

Para restaurar num projeto Supabase NOVO e vazio (connection string em $URL):
  psql "$URL" -v ON_ERROR_STOP=1 -f 1-estrutura.sql
  psql "$URL" -v ON_ERROR_STOP=1 -c "set session_replication_role = replica" -f 2-contas.sql -f 3-dados.sql
Detalhes no README do repositório, seção "Backup do banco".
TXT

# Confere que o dump não veio vazio antes de criptografar.
for arquivo in 1-estrutura.sql 3-dados.sql; do
  grep -q "PostgreSQL database dump complete" "$pasta/$arquivo" || { echo "Backup incompleto: $arquivo" >&2; exit 1; }
done

destino="$saida/$nome.tar.gz.gpg"
tar -czf - -C "$tmp" "$nome" \
  | gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 \
        --symmetric --cipher-algo AES256 -o "$destino" 3<<<"$BACKUP_SENHA"

echo "Backup criado: $destino ($(du -h "$destino" | cut -f1))"
