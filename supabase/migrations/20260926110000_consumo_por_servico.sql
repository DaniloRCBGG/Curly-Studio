-- Consumo de produto por serviço e baixa automática ao concluir o atendimento (RF11, RF12).
-- A Carol e as funcionárias informam quanto cada serviço gasta de cada produto, por tamanho de cabelo.

-- O tipo e a coluna de tamanho também são criados pela migração de preço por tamanho (outra branch);
-- aqui só se ainda não existirem, para as duas funcionarem juntas ou separadas.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tamanho_cabelo') then
    create type public.tamanho_cabelo as enum ('P', 'M', 'G', 'GG');
  end if;
end $$;
alter table public.agendamentos add column if not exists tamanho public.tamanho_cabelo;

-- Quantidade na menor unidade do produto (ml, g ou unidade), por tamanho de cabelo.
create table public.consumo_servico (
  servico_id uuid not null references public.servicos (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  tamanho public.tamanho_cabelo not null,
  quantidade numeric(12, 2) not null check (quantidade > 0),
  primary key (servico_id, produto_id, tamanho)
);

alter table public.consumo_servico enable row level security;
create policy "equipe gerencia consumo" on public.consumo_servico for all using (public.eh_equipe()) with check (public.eh_equipe());

-- Rastreia de qual atendimento veio cada baixa automática.
alter table public.movimentacoes_estoque add column agendamento_id uuid references public.agendamentos (id) on delete set null;

-- Ao concluir um atendimento, tira do estoque o consumo cadastrado para o serviço e o tamanho.
-- Sem tamanho no agendamento (serviço de preço único), usa o consumo do cabelo M.
-- Se o estoque não der, zera o produto em vez de impedir a conclusão: a contagem corrige depois.
create function public.baixar_estoque_do_atendimento() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c record;
  v_novo numeric;
begin
  if new.status <> 'concluido' or old.status = 'concluido' then
    return new;
  end if;

  for c in
    select cs.produto_id, cs.quantidade, p.estoque_atual, s.nome as servico
      from public.consumo_servico cs
      join public.produtos p on p.id = cs.produto_id
      join public.servicos s on s.id = cs.servico_id
     where cs.servico_id = new.servico_id and cs.tamanho = coalesce(new.tamanho, 'M') and p.ativo
     for update of p
  loop
    v_novo := greatest(c.estoque_atual - c.quantidade, 0);
    if v_novo = c.estoque_atual then
      continue;
    end if;
    perform set_config('curly.movimentando_estoque', 'sim', true);
    update public.produtos set estoque_atual = v_novo where id = c.produto_id;
    perform set_config('curly.movimentando_estoque', '', true);
    insert into public.movimentacoes_estoque (produto_id, tipo, quantidade, estoque_depois, observacao, feita_por, agendamento_id)
    values (c.produto_id, 'saida', v_novo - c.estoque_atual, v_novo,
            'Atendimento: ' || c.servico || ' (cabelo ' || coalesce(new.tamanho, 'M') || ')'
              || case when c.estoque_atual < c.quantidade then ', estoque não dava: conferir' else '' end,
            auth.uid(), new.id);
  end loop;
  return new;
end;
$$;

create trigger baixar_estoque_ao_concluir after update of status on public.agendamentos
for each row execute function public.baixar_estoque_do_atendimento();

