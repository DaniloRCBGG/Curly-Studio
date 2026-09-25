-- Testes do fluxo de reserva e sinal. Rodar com: npm run test:db
\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@ex.com', '{"origem":"autocadastro","nome":"Ana","telefone":"21999990000","cpf":"12345678909"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bia@ex.com', '{"origem":"autocadastro","nome":"Bia","telefone":"21999990001","cpf":"98765432100"}');

do $$ begin
  assert (select count(*) from public.clientes where usuario_id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')) = 2, 'autocadastro deveria criar a ficha';
  assert (select perfil from public.usuarios where id = '00000000-0000-0000-0000-00000000000a') = 'cliente';
end $$;

insert into public.servicos (id, nome, duracao_minutos, valor, valor_sinal)
  values ('00000000-0000-0000-0000-0000000000c1', 'Corte', 60, 150, 50);
insert into public.funcionarias (id, nome, cargo) values ('00000000-0000-0000-0000-0000000000d1', 'Carol', 'gerente');
insert into public.funcionaria_servicos values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1');

-- Ana reserva amanhã às 10h.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
create temp table t (id uuid);
insert into t select public.reservar_horario('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', date_trunc('day', now()) + interval '1 day 10 hours');
insert into public.sinais (agendamento_id, valor, provedor_cobranca_id) select id, 50, 'pay_1' from t;

-- Bia tenta o mesmo horário e é recusada.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  perform public.reservar_horario('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', date_trunc('day', now()) + interval '1 day 10 hours 30 minutes');
  raise exception 'deveria ter recusado horário sobreposto';
exception when others then
  assert sqlerrm = 'horario_indisponivel', 'erro inesperado: ' || sqlerrm;
end $$;

-- O Pix cai: agendamento confirmado; webhook repetido não muda nada.
do $$ begin
  assert public.confirmar_sinal('pay_1') = 'pago';
  assert public.confirmar_sinal('pay_1') = 'pago';
  assert (select status from public.agendamentos a join t on t.id = a.id) = 'agendado';
end $$;

-- Reserva de Bia às 14h expira sem pagamento e libera o horário.
insert into t select public.reservar_horario('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', date_trunc('day', now()) + interval '1 day 14 hours');
insert into public.sinais (agendamento_id, valor, provedor_cobranca_id)
  select a.id, 50, 'pay_2' from public.agendamentos a where a.inicio = date_trunc('day', now()) + interval '1 day 14 hours';
update public.agendamentos set expira_em = now() - interval '1 minute' where inicio = date_trunc('day', now()) + interval '1 day 14 hours';
do $$ begin
  assert (select count(*) from public.expirar_reservas() e where e.provedor_cobranca_id = 'pay_2') = 1, 'deveria expirar a reserva da Bia';
  assert (select count(*) from public.horarios_ocupados(now(), now() + interval '3 days') where funcionaria_id = '00000000-0000-0000-0000-0000000000d1') = 1;
end $$;

-- Ana pega o horário liberado; o Pix atrasado da Bia vira "pago após expirar".
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select public.reservar_horario('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', date_trunc('day', now()) + interval '1 day 14 hours');
do $$ begin
  assert public.confirmar_sinal('pay_2') = 'pago_apos_expirar';
end $$;

-- Ana cancela o agendamento confirmado.
do $$ begin
  perform public.cancelar_meu_agendamento((select id from t limit 1));
  assert (select status from public.agendamentos where id = (select id from t limit 1)) = 'cancelado';
end $$;

-- Bia não consegue cancelar agendamento da Ana.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  perform public.cancelar_meu_agendamento((select a.id from public.agendamentos a where a.status = 'aguardando_sinal' limit 1));
  raise exception 'deveria ter recusado';
exception when others then
  assert sqlerrm = 'agendamento_nao_cancelavel', 'erro inesperado: ' || sqlerrm;
end $$;

\echo TODOS_OS_TESTES_PASSARAM
rollback;
