-- Testes da revisão de segurança: reserva chamada direto pela API, sem passar pelo site. Rodar com: npm run test:db
\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000006a1', 'jo@ex.com', '{"origem":"autocadastro","nome":"Jô","telefone":"21955556666","cpf":"11144477735"}');
insert into public.servicos (id, nome, duracao_minutos, valor, valor_sinal)
  values ('00000000-0000-0000-0000-0000000006c1', 'Corte', 60, 150, 50);
insert into public.funcionarias (id, nome, cargo) values ('00000000-0000-0000-0000-0000000006d1', 'Carol', 'gerente');
insert into public.funcionaria_servicos values ('00000000-0000-0000-0000-0000000006d1', '00000000-0000-0000-0000-0000000006c1');

-- Próxima terça e próximo domingo, no horário do Rio (o salão abre terça a sábado).
create temp table dia as
  select (select d from generate_series(current_date + 1, current_date + 7, interval '1 day') d where extract(dow from d) = 2)::date as terca,
         (select d from generate_series(current_date + 1, current_date + 7, interval '1 day') d where extract(dow from d) = 0)::date as domingo;
create function pg_temp.as_(d date, h text) returns timestamptz language sql as $$ select (d + h::time) at time zone 'America/Sao_Paulo' $$;

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a1';

do $$
declare v_id uuid;
begin
  -- Pedir 100 mil minutos de reserva não segura o horário por mais de 30.
  v_id := public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia), '10:00'), 100000);
  assert (select expira_em from public.agendamentos where id = v_id) <= now() + interval '30 minutes', 'reserva não pode passar de 30 minutos';

  -- Fora do expediente, fora da grade de 30 minutos, dia fechado e muito longe: recusados.
  begin
    perform public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia), '03:00'));
    raise exception 'madrugada deveria ser recusada';
  exception when others then assert sqlerrm = 'fora_do_expediente', 'erro inesperado: ' || sqlerrm; end;
  begin
    perform public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia), '11:10'));
    raise exception 'horário quebrado deveria ser recusado';
  exception when others then assert sqlerrm = 'fora_do_expediente', 'erro inesperado: ' || sqlerrm; end;
  begin
    perform public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia), '18:30'));
    raise exception 'serviço passando do fechamento deveria ser recusado';
  exception when others then assert sqlerrm = 'fora_do_expediente', 'erro inesperado: ' || sqlerrm; end;
  begin
    perform public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select domingo from dia), '10:00'));
    raise exception 'domingo deveria ser recusado';
  exception when others then assert sqlerrm = 'fora_do_expediente', 'erro inesperado: ' || sqlerrm; end;
  begin
    perform public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia) + 210, '10:00'));
    raise exception 'daqui a 7 meses deveria ser recusado';
  exception when others then assert sqlerrm = 'horario_muito_distante', 'erro inesperado: ' || sqlerrm; end;

  -- Duas reservas sem sinal ao mesmo tempo, no máximo.
  perform public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia), '12:00'));
  begin
    perform public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia), '14:00'));
    raise exception 'terceira reserva pendente deveria ser recusada';
  exception when others then assert sqlerrm = 'reservas_pendentes_demais', 'erro inesperado: ' || sqlerrm; end;

  -- Pagou uma: libera espaço para outra.
  update public.agendamentos set status = 'agendado', expira_em = null where id = v_id;
  perform public.reservar_horario('00000000-0000-0000-0000-0000000006c1', '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia), '14:00'));

  -- Reagendar também respeita o expediente.
  begin
    perform public.reagendar_meu_agendamento(v_id, '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select domingo from dia), '10:00'));
    raise exception 'reagendar para domingo deveria ser recusado';
  exception when others then assert sqlerrm = 'fora_do_expediente', 'erro inesperado: ' || sqlerrm; end;
  perform public.reagendar_meu_agendamento(v_id, '00000000-0000-0000-0000-0000000006d1', pg_temp.as_((select terca from dia), '16:00'));
end $$;

-- Visitante sem login não reserva.
do $$ begin
  assert not has_function_privilege('anon', 'public.reservar_horario(uuid, uuid, timestamptz, integer, tamanho_cabelo)', 'execute'), 'visitante não reserva';
  assert not has_function_privilege('authenticated', 'public.horario_no_expediente(timestamptz, integer)', 'execute');
end $$;

rollback;
\echo SEGURANCA_OK
