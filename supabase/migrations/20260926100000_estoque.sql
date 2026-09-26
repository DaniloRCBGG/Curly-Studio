-- Estoque: produtos, fornecedores e movimentações.
-- Referência: planejamento/curly-studio-brief.md (RF08–RF10, RF12–RF15, RF28, RN01–RN03, RN08).
-- A baixa automática por atendimento (RF11) entra quando o registro de atendimento existir.

-- Fornecedores (RF15) -----------------------------------------------------------

create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  observacao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Produtos (RF08–RF10, RF14, RF28, RN03) ----------------------------------------
-- O estoque fica na menor unidade (ml, g ou unidade). tamanho_embalagem diz quanto vem em cada
-- embalagem (ex.: frasco de 500 ml), e é por ela que a equipe dá entrada nas compras.

create type unidade_produto as enum ('ml', 'g', 'un');

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  marca text,
  unidade unidade_produto not null,
  tamanho_embalagem numeric(12, 2) not null check (tamanho_embalagem > 0),
  valor_embalagem numeric(10, 2) check (valor_embalagem >= 0),
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  estoque_atual numeric(12, 2) not null default 0 check (estoque_atual >= 0),
  estoque_minimo numeric(12, 2) not null default 0 check (estoque_minimo >= 0),
  -- Quando a equipe define o mínimo à mão, as entradas deixam de recalculá-lo (RF28).
  minimo_manual boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Movimentações -------------------------------------------------------------------
-- quantidade é a variação no estoque, na menor unidade: positiva na entrada, negativa na saída.

create type tipo_movimentacao as enum ('entrada', 'saida', 'ajuste');

create table public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos (id) on delete cascade,
  tipo tipo_movimentacao not null,
  quantidade numeric(12, 2) not null check (quantidade <> 0),
  estoque_depois numeric(12, 2) not null,
  valor_total numeric(10, 2), -- quanto a compra custou (entrada); base do fluxo de caixa (RF32)
  observacao text,
  feita_por uuid references auth.users (id),
  criado_em timestamptz not null default now()
);

create index movimentacoes_produto_idx on public.movimentacoes_estoque (produto_id, criado_em desc);

-- Mínimo padrão (RN01): 10% do estoque atual, arredondado para cima.
create function public.minimo_padrao(p_estoque numeric) returns numeric
language sql immutable as $$
  select ceil(p_estoque * 0.10)
$$;

-- Registra uma movimentação e atualiza o estoque na mesma transação.
-- entrada e saida recebem a quantidade movimentada; ajuste recebe a contagem real (inventário).
create function public.movimentar_estoque(
  p_produto_id uuid,
  p_tipo tipo_movimentacao,
  p_quantidade numeric,
  p_valor_total numeric default null,
  p_observacao text default null
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_produto public.produtos;
  v_novo numeric;
begin
  if not public.eh_equipe() then
    raise exception 'sem_permissao';
  end if;
  if p_quantidade is null or p_quantidade < 0 or (p_tipo <> 'ajuste' and p_quantidade = 0) then
    raise exception 'quantidade_invalida';
  end if;

  select * into v_produto from public.produtos where id = p_produto_id for update;
  if not found then
    raise exception 'produto_nao_encontrado';
  end if;

  v_novo := case p_tipo
    when 'entrada' then v_produto.estoque_atual + p_quantidade
    when 'saida' then v_produto.estoque_atual - p_quantidade
    else p_quantidade
  end;
  if v_novo < 0 then
    raise exception 'estoque_insuficiente';
  end if;
  if v_novo = v_produto.estoque_atual then
    return v_novo; -- contagem igual ao sistema: nada a registrar
  end if;

  perform set_config('curly.movimentando_estoque', 'sim', true);
  update public.produtos
     set estoque_atual = v_novo,
         -- RN01: a base do mínimo é o estoque total depois da reposição, não só a última compra.
         estoque_minimo = case when p_tipo = 'entrada' and not minimo_manual then public.minimo_padrao(v_novo) else estoque_minimo end
   where id = p_produto_id;
  perform set_config('curly.movimentando_estoque', '', true);

  insert into public.movimentacoes_estoque (produto_id, tipo, quantidade, estoque_depois, valor_total, observacao, feita_por)
  values (p_produto_id, p_tipo, v_novo - v_produto.estoque_atual, v_novo,
          case when p_tipo = 'entrada' then p_valor_total end, nullif(trim(p_observacao), ''), auth.uid());

  return v_novo;
end;
$$;

revoke execute on function public.movimentar_estoque(uuid, tipo_movimentacao, numeric, numeric, text) from public, anon;
grant execute on function public.movimentar_estoque(uuid, tipo_movimentacao, numeric, numeric, text) to authenticated;

-- Estoque baixo (RF13, RN02): quantidade menor ou igual ao mínimo.
create view public.produtos_estoque_baixo with (security_invoker = true) as
  select * from public.produtos where ativo and estoque_atual <= estoque_minimo;

-- Políticas de acesso (RN08: funcionárias e gerente cuidam do estoque) ---------------

alter table public.fornecedores enable row level security;
alter table public.produtos enable row level security;
alter table public.movimentacoes_estoque enable row level security;

create policy "equipe gerencia fornecedores" on public.fornecedores for all using (public.eh_equipe()) with check (public.eh_equipe());
create policy "equipe gerencia produtos" on public.produtos for all using (public.eh_equipe()) with check (public.eh_equipe());
-- O histórico só muda por movimentar_estoque; a equipe apenas lê.
create policy "equipe vê movimentações" on public.movimentacoes_estoque for select using (public.eh_equipe());

-- estoque_atual só muda por movimentar_estoque, para o histórico bater com o saldo.
create function public.proteger_estoque_atual() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('curly.movimentando_estoque', true), '') <> 'sim' then
    if tg_op = 'INSERT' then
      new.estoque_atual := 0;
    elsif new.estoque_atual is distinct from old.estoque_atual then
      raise exception 'use_movimentar_estoque';
    end if;
  end if;
  return new;
end;
$$;

create trigger proteger_estoque_atual before insert or update on public.produtos
for each row execute function public.proteger_estoque_atual();
