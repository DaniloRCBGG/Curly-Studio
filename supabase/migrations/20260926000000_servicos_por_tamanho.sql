-- Serviços com grupo e preço por tamanho de cabelo (P, M, G, GG), como na tabela de valores do salão.
-- A partir daqui a lista de serviços do banco é a única fonte: home, aba Valores e agendamento leem dela,
-- e a equipe edita tudo no painel. O "valor" antigo continua como preço base (o do cabelo P).

create type tamanho_cabelo as enum ('P', 'M', 'G', 'GG');

alter table public.servicos
  add column grupo text not null default 'cuidados' check (grupo in ('cuidados', 'coloracao', 'mechas', 'ruivos')),
  add column preco_p numeric(10, 2) check (preco_p >= 0),
  add column preco_m numeric(10, 2) check (preco_m >= 0),
  add column preco_g numeric(10, 2) check (preco_g >= 0),
  add column preco_gg numeric(10, 2) check (preco_gg >= 0),
  add column a_partir_de boolean not null default false,
  add column observacoes text, -- uma observação por linha, aparece abaixo do serviço na aba Valores
  -- Preço por tamanho: os quatro juntos ou nenhum.
  add constraint servicos_precos_completos check (
    (preco_p is null and preco_m is null and preco_g is null and preco_gg is null)
    or (preco_p is not null and preco_m is not null and preco_g is not null and preco_gg is not null)
  );

-- Tamanho do cabelo escolhido pela cliente (vazio para serviços com preço único).
alter table public.agendamentos add column tamanho tamanho_cabelo;

-- Preço do serviço para um tamanho; sem preço por tamanho, vale o preço único.
create function public.valor_do_servico(s public.servicos, t tamanho_cabelo) returns numeric
language sql immutable as $$
  select case t
    when 'P' then coalesce(s.preco_p, s.valor)
    when 'M' then coalesce(s.preco_m, s.valor)
    when 'G' then coalesce(s.preco_g, s.valor)
    when 'GG' then coalesce(s.preco_gg, s.valor)
    else s.valor
  end;
$$;

-- Reserva agora recebe o tamanho: obrigatório quando o serviço tem preço por tamanho.
drop function public.reservar_horario(uuid, uuid, timestamptz, integer);

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

  perform public.expirar_reservas();

  insert into public.agendamentos (cliente_id, funcionaria_id, servico_id, inicio, fim, status, expira_em, valor, tamanho, criado_por)
  values (
    v_cliente_id, p_funcionaria_id, p_servico_id, p_inicio,
    p_inicio + make_interval(mins => v_servico.duracao_minutos),
    'aguardando_sinal', now() + make_interval(mins => p_minutos_reserva),
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
