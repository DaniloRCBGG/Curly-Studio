-- Contato da cliente: telefone ou e-mail, pelo menos um dos dois (antes o telefone era obrigatório).
update public.clientes set telefone = null where telefone = '';
alter table public.clientes alter column telefone drop not null;
alter table public.clientes add constraint clientes_tem_contato
  check (nullif(telefone, '') is not null or nullif(email, '') is not null);

-- Lista de contatos para a Carol salvar no WhatsApp do salão: marca quem já foi exportada,
-- para a próxima lista trazer só as clientes novas.
alter table public.clientes add column contato_exportado_em timestamptz;
