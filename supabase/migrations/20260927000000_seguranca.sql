-- Revisão de segurança (2026-09-27).
-- 1. Reserva pelo site: o banco confere expediente, grade de 30 min, prazo máximo e limite de reservas,
--    porque a cliente consegue chamar a função direto com a chave pública, sem passar pelo site.
-- 2. Vínculo do cadastro do site com a ficha do balcão: CPF ou telefone sozinhos não bastam mais
--    (são fáceis de descobrir). O resto vira sugestão para a equipe juntar as fichas no painel.
-- 3. A cliente não muda CPF, e-mail nem a marca de contato exportado da própria ficha.

-- 1. Reserva ---------------------------------------------------------------------------------

-- Confere se o horário cabe no expediente do dia e cai na grade de 30 minutos da agenda.
create function public.horario_no_expediente(p_inicio timestamptz, p_minutos integer) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_local timestamp := p_inicio at time zone 'America/Sao_Paulo';
  v_fim timestamp := v_local + make_interval(mins => p_minutos);
  v_exp public.horario_funcionamento;
begin
  select * into v_exp from public.horario_funcionamento where dia_semana = extract(dow from v_local)::smallint;
  return found
    and v_fim::date = v_local::date
    and v_local::time >= v_exp.abre
    and v_fim::time <= v_exp.fecha
    and extract(epoch from (v_local::time - v_exp.abre))::integer % 1800 = 0;
end;
$$;

revoke execute on function public.horario_no_expediente(timestamptz, integer) from public, anon, authenticated;

-- Quantas reservas sem sinal confirmado uma cliente pode segurar ao mesmo tempo.
create function public.limite_reservas_pendentes() returns integer
language sql immutable as $$ select 2 $$;

drop function public.reservar_horario(uuid, uuid, timestamptz, integer, tamanho_cabelo);

create function public.reservar_horario(
  p_servico_id uuid,
  p_funcionaria_id uuid,
  p_inicio timestamptz,
  p_minutos_reserva integer default 15,
  p_tamanho tamanho_cabelo default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_cliente_id uuid;
  v_servico public.servicos;
  v_id uuid;
begin
  select id into v_cliente_id from public.clientes where usuario_id = auth.uid();
  if v_cliente_id is null then
    raise exception 'cliente_nao_encontrada';
  end if;

  select * into v_servico from public.servicos where id = p_servico_id and ativo;
  if not found then
    raise exception 'servico_invalido';
  end if;

  if v_servico.preco_p is not null and p_tamanho is null then
    raise exception 'tamanho_obrigatorio';
  end if;

  if not exists (
    select 1 from public.funcionaria_servicos fs
      join public.funcionarias f on f.id = fs.funcionaria_id
     where fs.servico_id = p_servico_id and fs.funcionaria_id = p_funcionaria_id and f.ativa and f.atende
  ) then
    raise exception 'profissional_invalida';
  end if;

  if p_inicio < now() then
    raise exception 'horario_passado';
  end if;
  if p_inicio > now() + interval '90 days' then
    raise exception 'horario_muito_distante';
  end if;
  if not public.horario_no_expediente(p_inicio, v_servico.duracao_minutos) then
    raise exception 'fora_do_expediente';
  end if;

  perform public.expirar_reservas();

  -- Sem isso, uma pessoa segura a agenda inteira sem pagar nenhum sinal.
  perform 1 from public.clientes where id = v_cliente_id for update;
  if (select count(*) from public.agendamentos
       where cliente_id = v_cliente_id and status = 'aguardando_sinal' and expira_em >= now()) >= public.limite_reservas_pendentes() then
    raise exception 'reservas_pendentes_demais';
  end if;

  insert into public.agendamentos (cliente_id, funcionaria_id, servico_id, inicio, fim, status, expira_em, valor, tamanho, criado_por)
  values (
    v_cliente_id, p_funcionaria_id, p_servico_id, p_inicio,
    p_inicio + make_interval(mins => v_servico.duracao_minutos),
    -- O tempo de reserva vem do site, mas quem chama direto não pode pedir mais que 30 minutos.
    'aguardando_sinal', now() + make_interval(mins => least(greatest(coalesce(p_minutos_reserva, 15), 5), 30)),
    public.valor_do_servico(v_servico, case when v_servico.preco_p is null then null else p_tamanho end),
    case when v_servico.preco_p is null then null else p_tamanho end,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'horario_indisponivel';
end;
$$;

revoke execute on function public.reservar_horario(uuid, uuid, timestamptz, integer, tamanho_cabelo) from public, anon;
grant execute on function public.reservar_horario(uuid, uuid, timestamptz, integer, tamanho_cabelo) to authenticated;

create or replace function public.reagendar_meu_agendamento(p_agendamento_id uuid, p_funcionaria_id uuid, p_inicio timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ag public.agendamentos;
begin
  select a.* into v_ag from public.agendamentos a join public.clientes c on c.id = a.cliente_id
   where a.id = p_agendamento_id and c.usuario_id = auth.uid() and a.status = 'agendado' and a.inicio > now()
   for update of a;
  if not found then
    raise exception 'agendamento_nao_reagendavel';
  end if;
  if p_inicio < now() then
    raise exception 'horario_passado';
  end if;
  if p_inicio > now() + interval '90 days' then
    raise exception 'horario_muito_distante';
  end if;
  if not public.horario_no_expediente(p_inicio, (extract(epoch from (v_ag.fim - v_ag.inicio)) / 60)::integer) then
    raise exception 'fora_do_expediente';
  end if;
  if not exists (
    select 1 from public.funcionaria_servicos fs join public.funcionarias f on f.id = fs.funcionaria_id
     where fs.servico_id = v_ag.servico_id and fs.funcionaria_id = p_funcionaria_id and f.ativa and f.atende
  ) then
    raise exception 'profissional_invalida';
  end if;
  perform public.expirar_reservas();
  update public.agendamentos
     set funcionaria_id = p_funcionaria_id, inicio = p_inicio, fim = p_inicio + (v_ag.fim - v_ag.inicio)
   where id = p_agendamento_id;
exception
  when exclusion_violation then
    raise exception 'horario_indisponivel';
end;
$$;

-- 2. Vínculo com a ficha do balcão -------------------------------------------------------------
-- Liga sozinho só quando há prova de que é a mesma pessoa:
--   a) mesmo e-mail, e o e-mail da conta já foi confirmado (link de confirmação ou Google);
--   b) mesmo CPF e mais o mesmo telefone ou e-mail.
-- Em qualquer caso, só uma ficha candidata e sem CPF diferente. Fora disso, a conta ganha ficha
-- nova e a equipe junta as duas no painel (Clientes > Fichas para juntar), depois de conferir.
create or replace function public.vincular_ficha(p_usuario uuid, p_email text, m jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_cpf text := nullif(regexp_replace(coalesce(m ->> 'cpf', ''), '\D', '', 'g'), '');
  v_tel text := nullif(regexp_replace(coalesce(m ->> 'telefone', ''), '\D', '', 'g'), '');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_email_confirmado boolean;
  v_ficha uuid;
begin
  select email_confirmed_at is not null into v_email_confirmado from auth.users where id = p_usuario;

  if v_email is not null and coalesce(v_email_confirmado, false) then
    select min(id::text)::uuid into v_ficha from public.clientes
     where usuario_id is null and lower(trim(email)) = v_email
       and (cpf is null or v_cpf is null or regexp_replace(cpf, '\D', '', 'g') = v_cpf)
    having count(*) = 1;
  end if;

  if v_ficha is null and v_cpf is not null then
    select min(id::text)::uuid into v_ficha from public.clientes
     where usuario_id is null and regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = v_cpf
       and ((v_tel is not null and regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = v_tel)
         or (v_email is not null and lower(trim(coalesce(email, ''))) = v_email))
    having count(*) = 1;
  end if;

  if v_ficha is not null then
    -- Os dados que a cliente digitou no site valem mais que os anotados no balcão.
    update public.clientes set
      usuario_id = p_usuario,
      nome = coalesce(nullif(m ->> 'nome', ''), nome),
      telefone = coalesce(v_tel, telefone),
      email = coalesce(p_email, email),
      cpf = coalesce(v_cpf, cpf),
      cep = coalesce(nullif(m ->> 'cep', ''), cep),
      endereco = coalesce(nullif(m ->> 'endereco', ''), endereco),
      bairro = coalesce(nullif(m ->> 'bairro', ''), bairro),
      cidade = coalesce(nullif(m ->> 'cidade', ''), cidade),
      aceite_privacidade_em = now()
     where id = v_ficha;
  else
    insert into public.clientes (usuario_id, nome, telefone, email, cpf, cep, endereco, bairro, cidade, aceite_privacidade_em)
    values (p_usuario, m ->> 'nome', coalesce(v_tel, m ->> 'telefone'), p_email, v_cpf, m ->> 'cep', m ->> 'endereco', m ->> 'bairro', m ->> 'cidade', now())
    returning id into v_ficha;
  end if;
  return v_ficha;
end;
$$;

revoke execute on function public.vincular_ficha(uuid, text, jsonb) from public, anon, authenticated;

-- Com a confirmação de e-mail ligada, a conta nasce sem e-mail confirmado: a ficha só é criada
-- (ou ligada à do balcão) quando a cliente clica no link. Antes disso ela nem consegue entrar.
create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios (id, perfil) values (new.id, 'cliente') on conflict do nothing;
  if coalesce(new.raw_user_meta_data ->> 'origem', '') = 'autocadastro' and new.email_confirmed_at is not null then
    perform public.vincular_ficha(new.id, new.email, new.raw_user_meta_data);
  end if;
  return new;
end;
$$;

create function public.email_confirmado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null
     and coalesce(new.raw_user_meta_data ->> 'origem', '') = 'autocadastro'
     and not exists (select 1 from public.clientes where usuario_id = new.id) then
    perform public.vincular_ficha(new.id, new.email, new.raw_user_meta_data);
  end if;
  return new;
end;
$$;

revoke execute on function public.email_confirmado() from public, anon, authenticated;
revoke execute on function public.novo_usuario() from public, anon, authenticated;

create trigger ao_confirmar_email after update of email_confirmed_at on auth.users
for each row execute function public.email_confirmado();

-- Pares "ficha do site" + "ficha do balcão" com o mesmo CPF, telefone ou e-mail, para a equipe
-- conferir com a cliente e juntar. Roda com a permissão de quem chama: só a equipe enxerga.
create function public.fichas_para_juntar()
returns table (site_id uuid, site_nome text, balcao_id uuid, balcao_nome text, motivo text)
language sql stable set search_path = public as $$
  select s.id, s.nome, b.id, b.nome,
         case
           when s.cpf is not null and regexp_replace(coalesce(b.cpf, ''), '\D', '', 'g') = regexp_replace(s.cpf, '\D', '', 'g') then 'mesmo CPF'
           when nullif(regexp_replace(coalesce(s.telefone, ''), '\D', '', 'g'), '') = regexp_replace(coalesce(b.telefone, ''), '\D', '', 'g') then 'mesmo telefone'
           else 'mesmo e-mail'
         end
    from public.clientes s
    join public.clientes b on b.usuario_id is null and b.id <> s.id and (
         (s.cpf is not null and regexp_replace(coalesce(b.cpf, ''), '\D', '', 'g') = regexp_replace(s.cpf, '\D', '', 'g'))
      or nullif(regexp_replace(coalesce(s.telefone, ''), '\D', '', 'g'), '') = regexp_replace(coalesce(b.telefone, ''), '\D', '', 'g')
      or nullif(lower(trim(coalesce(s.email, ''))), '') = lower(trim(coalesce(b.email, ''))))
   where s.usuario_id is not null
     and public.eh_equipe()
   order by s.criado_em desc
   limit 50
$$;

revoke execute on function public.fichas_para_juntar() from public, anon;
grant execute on function public.fichas_para_juntar() to authenticated;

-- A equipe confirmou com a cliente que as duas fichas são dela: os atendimentos do balcão passam
-- para a ficha do site, os campos vazios são completados e a ficha do balcão é apagada.
create function public.juntar_fichas(p_site uuid, p_balcao uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  b public.clientes;
begin
  if not public.eh_equipe() then
    raise exception 'sem_permissao';
  end if;
  select * into b from public.clientes where id = p_balcao and usuario_id is null for update;
  if not found or not exists (select 1 from public.clientes where id = p_site and usuario_id is not null) then
    raise exception 'fichas_invalidas';
  end if;
  update public.agendamentos set cliente_id = p_site where cliente_id = p_balcao;
  delete from public.clientes where id = p_balcao;
  update public.clientes s set
    telefone = coalesce(nullif(s.telefone, ''), b.telefone),
    email = coalesce(nullif(s.email, ''), b.email),
    cpf = coalesce(nullif(s.cpf, ''), b.cpf),
    cep = coalesce(nullif(s.cep, ''), b.cep),
    endereco = coalesce(nullif(s.endereco, ''), b.endereco),
    bairro = coalesce(nullif(s.bairro, ''), b.bairro),
    cidade = coalesce(nullif(s.cidade, ''), b.cidade),
    contato_exportado_em = coalesce(s.contato_exportado_em, b.contato_exportado_em),
    criado_em = least(s.criado_em, b.criado_em)
   where s.id = p_site;
end;
$$;

revoke execute on function public.juntar_fichas(uuid, uuid) from public, anon;
grant execute on function public.juntar_fichas(uuid, uuid) to authenticated;

-- 3. Campos da ficha que a cliente não muda sozinha ---------------------------------------------
create or replace function public.proteger_campos_da_ficha() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Equipe e servidor (chave de serviço) podem tudo; a cliente só muda os dados de contato.
  -- CPF e e-mail ficam travados: foram eles que ligaram a conta a esta ficha.
  if current_user in ('anon', 'authenticated') and not public.eh_equipe() then
    new.usuario_id := old.usuario_id;
    new.asaas_customer_id := old.asaas_customer_id;
    new.aceite_privacidade_em := old.aceite_privacidade_em;
    new.criado_em := old.criado_em;
    new.latitude := old.latitude;
    new.longitude := old.longitude;
    new.cpf := old.cpf;
    new.email := old.email;
    new.contato_exportado_em := old.contato_exportado_em;
  end if;
  return new;
end;
$$;
