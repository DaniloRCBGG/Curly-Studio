-- Testes do Pix manual (chave da Carol, confirmação no painel). Rodar com: npm run test:db
\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000005a1', 'cris@ex.com', '{"origem":"autocadastro","nome":"Cris","telefone":"21955550000","cpf":"11144477735"}'),
  ('00000000-0000-0000-0000-0000000005a2', 'dora@ex.com', '{"origem":"autocadastro","nome":"Dora","telefone":"21955550001","cpf":"93541134780"}'),
  ('00000000-0000-0000-0000-0000000005e1', 'equipe@ex.com', '{}');
update public.usuarios set perfil = 'funcionaria' where id = '00000000-0000-0000-0000-0000000005e1';

insert into public.servicos (id, nome, duracao_minutos, valor, valor_sinal)
  values ('00000000-0000-0000-0000-0000000005c1', 'Corte', 60, 150, 50);
insert into public.funcionarias (id, nome, cargo) values ('00000000-0000-0000-0000-0000000005d1', 'Carol', 'gerente');
insert into public.funcionaria_servicos values ('00000000-0000-0000-0000-0000000005d1', '00000000-0000-0000-0000-0000000005c1');

-- Cris reserva daqui a dois dias e recebe o Pix manual.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a1';
create temp table t (id uuid);
insert into t select public.reservar_horario('00000000-0000-0000-0000-0000000005c1', '00000000-0000-0000-0000-0000000005d1', date_trunc('day', now()) + interval '2 days 10 hours', 30);
insert into public.sinais (agendamento_id, valor, forma, provedor_cobranca_id) select id, 50, 'pix_manual', 'manual_' || id from t;

-- Outra cliente não pode avisar pagamento pela Cris.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a2';
do $$ begin
  perform public.informar_pagamento((select id from t));
  raise exception 'deveria recusar';
exception when others then
  assert sqlerrm = 'reserva_nao_encontrada', 'erro inesperado: ' || sqlerrm;
end $$;

-- Cris avisa que pagou: o horário fica guardado até a hora do atendimento.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a1';
select public.informar_pagamento((select id from t));
do $$ begin
  assert (select expira_em from public.agendamentos where id = (select id from t)) = date_trunc('day', now()) + interval '2 days 10 hours', 'deveria guardar até o início';
  assert (select cliente_informou_em from public.sinais where agendamento_id = (select id from t)) is not null;
end $$;

-- Cliente não confirma o próprio sinal.
do $$ begin
  perform public.confirmar_sinal_manual((select id from t));
  raise exception 'deveria recusar';
exception when others then
  assert sqlerrm = 'sem_permissao', 'erro inesperado: ' || sqlerrm;
end $$;

-- A equipe confirma: agendado.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005e1';
do $$ begin
  assert public.confirmar_sinal_manual((select id from t)) = 'pago';
  assert (select status from public.agendamentos where id = (select id from t)) = 'agendado';
  assert (select status from public.sinais where agendamento_id = (select id from t)) = 'pago';
end $$;

-- Reserva que venceu sem aviso ainda pode ser confirmada se o horário estiver livre.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a2';
truncate t;
insert into t select public.reservar_horario('00000000-0000-0000-0000-0000000005c1', '00000000-0000-0000-0000-0000000005d1', date_trunc('day', now()) + interval '3 days 10 hours', 30);
insert into public.sinais (agendamento_id, valor, forma, provedor_cobranca_id) select id, 50, 'pix_manual', 'manual_' || id from t;
reset request.jwt.claim.sub;
update public.agendamentos set expira_em = now() - interval '1 minute' where id = (select id from t);
select public.expirar_reservas();
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005e1';
do $$ begin
  assert public.confirmar_sinal_manual((select id from t)) = 'pago';
  assert (select status from public.agendamentos where id = (select id from t)) = 'agendado';
end $$;

-- O papel anônimo não enxerga as funções.
do $$ begin
  assert not has_function_privilege('anon', 'public.informar_pagamento(uuid)', 'execute');
  assert not has_function_privilege('anon', 'public.confirmar_sinal_manual(uuid)', 'execute');
end $$;

rollback;
\echo PIX_MANUAL_OK
