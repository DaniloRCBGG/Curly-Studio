#!/usr/bin/env bash
# Abre um backup criado por scripts/backup-banco.sh.
#
# Uso:
#   BACKUP_SENHA='...' scripts/abrir-backup.sh curly-studio-AAAA-MM-DD_HHMM.tar.gz.gpg [pasta]
#
# Cria a pasta com 1-estrutura.sql, 2-contas.sql, 3-dados.sql e LEIA-ME.txt.
# Apague a pasta quando terminar: os arquivos ficam sem criptografia.
set -euo pipefail

arquivo="${1:?Informe o arquivo .tar.gz.gpg do backup}"
destino="${2:-.}"
: "${BACKUP_SENHA:?Defina BACKUP_SENHA (a mesma usada no backup)}"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
if ! gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt -o "$tmp" --yes "$arquivo" 3<<<"$BACKUP_SENHA" 2>/dev/null; then
  echo "Não foi possível abrir o backup: senha errada ou arquivo corrompido." >&2
  exit 1
fi
mkdir -p "$destino"
tar -xzf "$tmp" -C "$destino"

echo "Backup aberto em: $destino/$(basename "$arquivo" .tar.gz.gpg)"
