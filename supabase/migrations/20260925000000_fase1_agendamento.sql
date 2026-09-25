-- Fase 1: clientes, equipe, serviços e agendamento com sinal por Pix.
-- Referência: planejamento/curly-studio-brief.md (RF01–RF07, RF22–RF27, RF31, RF33).

create extension if not exists btree_gist;

-- Perfis --------------------------------------------------------------------

create type perfil as enum ('cliente', 'funcionaria', 'gerente');

create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  perfil perfil not null default 'cliente',
  criado_em timestamptz not null default now()
);

-- Funções auxiliares usadas nas políticas de acesso.
create function public.perfil_atual() returns perfil
language sql stable security definer set search_path = public as $$
  select perfil from public.usuarios where id = auth.uid()
$$;

create function public.eh_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.perfil_atual() in ('funcionaria', 'gerente'), false)
$$;

create function public.eh_gerente() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.perfil_atual() = 'gerente', false)
$$;

-- Clientes (RF01, RF26, RN07) ---------------------------------------------------
-- usuario_id é nulo quando a funcionária cadastra a cliente na chegada ao salão.

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references auth.users (id) on delete set null,
  nome text not null,
  telefone text not null,
  email text,
  cpf text,
  cep text,
  endereco text,
  bairro text,
  cidade text,
  latitude double precision,
  longitude double precision,
  aceite_privacidade_em timestamptz,
  asaas_customer_id text,
  criado_em timestamptz not null default now()
);

create index clientes_telefone_idx on public.clientes (telefone);

-- Equipe (RF02, RF29) -----------------------------------------------------------

create type cargo as enum ('gerente', 'cabeleireira_auxiliar', 'assistente');
create type modalidade_remuneracao as enum ('diaria', 'comissao', 'por_atendimento');

create table public.funcionarias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references auth.users (id) on delete set null,
  nome text not null,
  cargo cargo not null,
  modalidade modalidade_remuneracao,
  valor_diaria_semana numeric(10, 2),
  valor_diaria_sabado numeric(10, 2),
  percentual_comissao numeric(5, 2),
  atende boolean not null default true, -- aparece como opção na agenda
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Serviços (RF03, RF25) ---------------------------------------------------------

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  duracao_minutos integer not null check (duracao_minutos > 0),
  valor numeric(10, 2) not null check (valor >= 0),
  valor_sinal numeric(10, 2) not null check (valor_sinal > 0),
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create table public.funcionaria_servicos (
  funcionaria_id uuid not null references public.funcionarias (id) on delete cascade,
  servico_id uuid not null references public.servicos (id) on delete cascade,
  primary key (funcionaria_id, servico_id)
);

-- Horário de funcionamento (0 = domingo … 6 = sábado).
create table public.horario_funcionamento (
  dia_semana smallint primary key check (dia_semana between 0 and 6),
  abre time not null,
  fecha time not null check (fecha > abre)
);

-- Agendamentos (RF04–RF07, RF27, RF33, RN04, RN09) ------------------------------
-- aguardando_sinal: horário reservado enquanto o Pix não é pago (expira_em).
-- agendado: sinal pago. expirado: o Pix não foi pago a tempo e o horário voltou a ficar livre.

create type status_agendamento as enum ('aguardando_sinal', 'agendado', 'concluido', 'cancelado', 'expirado');

create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  funcionaria_id uuid not null references public.funcionarias (id),
  servico_id uuid not null references public.servicos (id),
  inicio timestamptz not null,
  fim timestamptz not null check (fim > inicio),
  status status_agendamento not null default 'aguardando_sinal',
  expira_em timestamptz,
  valor numeric(10, 2) not null,
  criado_por uuid references auth.users (id),
  cancelado_em timestamptz,
  criado_em timestamptz not null default now(),
  -- Impede dois agendamentos ativos da mesma profissional no mesmo horário.
  constraint agendamentos_sem_sobreposicao exclude using gist (
    funcionaria_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status in ('aguardando_sinal', 'agendado'))
);

create index agendamentos_cliente_idx on public.agendamentos (cliente_id);
create index agendamentos_inicio_idx on public.agendamentos (inicio);

create type status_sinal as enum ('pendente', 'pago', 'expirado', 'pago_apos_expirar', 'cancelado');
create type forma_sinal as enum ('pix_online', 'presencial');

create table public.sinais (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null unique references public.agendamentos (id) on delete cascade,
  valor numeric(10, 2) not null,
  forma forma_sinal not null default 'pix_online',
  status status_sinal not null default 'pendente',
  provedor_cobranca_id text unique,
  pix_copia_e_cola text,
  pix_qr_code_base64 text,
  pago_em timestamptz,
  criado_em timestamptz not null default now()
);

-- Libera horários cujo Pix não foi pago dentro do prazo.
-- Chamada antes de reservar e pelo cron; devolve as cobranças que devem ser canceladas no provedor.
create function public.expirar_reservas()
returns table (agendamento_id uuid, provedor_cobranca_id text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with expirados as (
    update public.agendamentos a
       set status = 'expirado'
     where a.status = 'aguardando_sinal' and a.expira_em < now()
    returning a.id
  )
  update public.sinais s
     set status = 'expirado'
    from expirados e
   where s.agendamento_id = e.id and s.status = 'pendente'
  returning s.agendamento_id, s.provedor_cobranca_id;
end;
$$;

-- Horários ocupados de um dia, sem expor quem é a cliente.
create function public.horarios_ocupados(dia_inicio timestamptz, dia_fim timestamptz)
returns table (funcionaria_id uuid, inicio timestamptz, fim timestamptz)
language sql stable security definer set search_path = public as $$
  select a.funcionaria_id, a.inicio, a.fim
    from public.agendamentos a
   where a.inicio < dia_fim and a.fim > dia_inicio
     and (a.status = 'agendado' or (a.status = 'aguardando_sinal' and a.expira_em >= now()))
$$;

-- Reserva o horário para a cliente logada. O sinal é criado depois, pelo servidor, com a cobrança Pix.
create function public.reservar_horario(
  p_servico_id uuid,
  p_funcionaria_id uuid,
  p_inicio timestamptz,
  p_minutos_reserva integer default 15
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

  insert into public.agendamentos (cliente_id, funcionaria_id, servico_id, inicio, fim, status, expira_em, valor, criado_por)
  values (
    v_cliente_id, p_funcionaria_id, p_servico_id, p_inicio,
    p_inicio + make_interval(mins => v_servico.duracao_minutos),
    'aguardando_sinal', now() + make_interval(mins => p_minutos_reserva),
    v_servico.valor, auth.uid()
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'horario_indisponivel';
end;
$$;

-- Confirma o sinal quando o provedor avisa que o Pix caiu (chamada pelo webhook com a chave de serviço).
-- Se a reserva já tinha expirado, reativa quando o horário ainda está livre; senão marca para devolução.
create function public.confirmar_sinal(p_provedor_cobranca_id text)
returns status_sinal
language plpgsql security definer set search_path = public as $$
declare
  v_sinal public.sinais;
  v_status_agendamento status_agendamento;
begin
  select * into v_sinal from public.sinais where provedor_cobranca_id = p_provedor_cobranca_id for update;
  if not found then
    return null;
  end if;
  if v_sinal.status in ('pago', 'pago_apos_expirar') then
    return v_sinal.status; -- webhook repetido
  end if;

  select status into v_status_agendamento from public.agendamentos where id = v_sinal.agendamento_id for update;

  if v_status_agendamento = 'aguardando_sinal' then
    update public.agendamentos set status = 'agendado', expira_em = null where id = v_sinal.agendamento_id;
    update public.sinais set status = 'pago', pago_em = now() where id = v_sinal.id;
    return 'pago';
  end if;

  if v_status_agendamento = 'expirado' then
    begin
      update public.agendamentos set status = 'agendado', expira_em = null where id = v_sinal.agendamento_id;
      update public.sinais set status = 'pago', pago_em = now() where id = v_sinal.id;
      return 'pago';
    exception when exclusion_violation then
      update public.sinais set status = 'pago_apos_expirar', pago_em = now() where id = v_sinal.id;
      return 'pago_apos_expirar';
    end;
  end if;

  update public.sinais set status = 'pago_apos_expirar', pago_em = now() where id = v_sinal.id;
  return 'pago_apos_expirar';
end;
$$;


-- Cancelamento e reagendamento pela própria cliente (RF07, RN04). O sinal fica registrado; a devolução é decidida pelo salão.
create function public.cancelar_meu_agendamento(p_agendamento_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.agendamentos a
     set status = 'cancelado', cancelado_em = now()
    from public.clientes c
   where a.id = p_agendamento_id and c.id = a.cliente_id and c.usuario_id = auth.uid()
     and a.status in ('aguardando_sinal', 'agendado') and a.inicio > now();
  if not found then
    raise exception 'agendamento_nao_cancelavel';
  end if;
  update public.sinais set status = 'cancelado' where agendamento_id = p_agendamento_id and status = 'pendente';
end;
$$;

create function public.reagendar_meu_agendamento(p_agendamento_id uuid, p_funcionaria_id uuid, p_inicio timestamptz) returns void
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

revoke execute on function public.confirmar_sinal(text) from public, anon, authenticated;
revoke execute on function public.expirar_reservas() from public, anon, authenticated;

-- Cria o registro de usuário e a ficha de cliente no autocadastro (RF26).
create function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios (id, perfil) values (new.id, 'cliente') on conflict do nothing;
  if coalesce(new.raw_user_meta_data ->> 'origem', '') = 'autocadastro' then
    insert into public.clientes (usuario_id, nome, telefone, email, cpf, cep, endereco, bairro, cidade, aceite_privacidade_em)
    values (
      new.id,
      new.raw_user_meta_data ->> 'nome',
      new.raw_user_meta_data ->> 'telefone',
      new.email,
      new.raw_user_meta_data ->> 'cpf',
      new.raw_user_meta_data ->> 'cep',
      new.raw_user_meta_data ->> 'endereco',
      new.raw_user_meta_data ->> 'bairro',
      new.raw_user_meta_data ->> 'cidade',
      now()
    );
  end if;
  return new;
end;
$$;

create trigger ao_criar_usuario after insert on auth.users
for each row execute function public.novo_usuario();

-- Políticas de acesso (RNF01, RNF02) ---------------------------------------------

alter table public.usuarios enable row level security;
alter table public.clientes enable row level security;
alter table public.funcionarias enable row level security;
alter table public.servicos enable row level security;
alter table public.funcionaria_servicos enable row level security;
alter table public.horario_funcionamento enable row level security;
alter table public.agendamentos enable row level security;
alter table public.sinais enable row level security;

create policy "vê o próprio perfil" on public.usuarios for select using (id = auth.uid() or public.eh_gerente());
create policy "gerente altera perfis" on public.usuarios for update using (public.eh_gerente());

create policy "cliente vê a própria ficha" on public.clientes for select using (usuario_id = auth.uid() or public.eh_equipe());
create policy "cliente edita a própria ficha" on public.clientes for update
  using (usuario_id = auth.uid() or public.eh_equipe())
  with check (usuario_id = auth.uid() or public.eh_equipe());
create policy "equipe cadastra clientes" on public.clientes for insert with check (public.eh_equipe());

-- Serviços, profissionais e horários são públicos para o site e a agenda.
create policy "serviços ativos são públicos" on public.servicos for select using (ativo or public.eh_equipe());
create policy "equipe gerencia serviços" on public.servicos for all using (public.eh_equipe()) with check (public.eh_equipe());

create policy "profissionais ativas são públicas" on public.funcionarias for select using (ativa or public.eh_equipe());
create policy "gerente gerencia equipe" on public.funcionarias for all using (public.eh_gerente()) with check (public.eh_gerente());

create policy "vínculos são públicos" on public.funcionaria_servicos for select using (true);
create policy "gerente gerencia vínculos" on public.funcionaria_servicos for all using (public.eh_gerente()) with check (public.eh_gerente());

create policy "horário é público" on public.horario_funcionamento for select using (true);
create policy "gerente altera horário" on public.horario_funcionamento for all using (public.eh_gerente()) with check (public.eh_gerente());

create policy "cliente vê os próprios agendamentos" on public.agendamentos for select using (
  public.eh_equipe() or cliente_id in (select id from public.clientes where usuario_id = auth.uid())
);
create policy "equipe gerencia agendamentos" on public.agendamentos for all using (public.eh_equipe()) with check (public.eh_equipe());

create policy "cliente vê os próprios sinais" on public.sinais for select using (
  public.eh_equipe() or agendamento_id in (
    select a.id from public.agendamentos a join public.clientes c on c.id = a.cliente_id where c.usuario_id = auth.uid()
  )
);
create policy "equipe gerencia sinais" on public.sinais for all using (public.eh_equipe()) with check (public.eh_equipe());

-- Dados iniciais: terça a sexta e sábado, como na regra de diárias. A gerente ajusta depois.
insert into public.horario_funcionamento (dia_semana, abre, fecha) values
  (2, '09:00', '19:00'),
  (3, '09:00', '19:00'),
  (4, '09:00', '19:00'),
  (5, '09:00', '19:00'),
  (6, '09:00', '17:00');
