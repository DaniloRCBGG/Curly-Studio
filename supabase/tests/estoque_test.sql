-- Testes do estoque: entrada, saída, ajuste, mínimo de 10% e permissões. Rodar com: npm run test:db
\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'juliana@ex.com'),
  ('00000000-0000-0000-0000-0000000000e2', 'cliente@ex.com');
update public.usuarios set perfil = 'funcionaria' where id = '00000000-0000-0000-0000-0000000000e1';

insert into public.produtos (id, nome, unidade, tamanho_embalagem, estoque_atual)
  values ('00000000-0000-0000-0000-0000000000f1', 'Máscara de hidratação', 'g', 1000, 999);

do $$ begin
  assert (select estoque_atual from public.produtos where id = '00000000-0000-0000-0000-0000000000f1') = 0,
    'estoque inicial só entra por movimentação';
  assert exists (select 1 from public.produtos_estoque_baixo where id = '00000000-0000-0000-0000-0000000000f1'),
    'produto zerado aparece como estoque baixo';
end $$;

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';

-- Entrada de 2 potes de 1 kg: mínimo vira 10% de 2000 g.
do $$ begin
  assert public.movimentar_estoque('00000000-0000-0000-0000-0000000000f1', 'entrada', 2000, 180, 'compra') = 2000;
  assert (select estoque_minimo from public.produtos where id = '00000000-0000-0000-0000-0000000000f1') = 200;
end $$;

-- Saída de 1850 g deixa 150 g, abaixo do mínimo; mínimo não muda na saída.
do $$ begin
  perform public.movimentar_estoque('00000000-0000-0000-0000-0000000000f1', 'saida', 1850);
  assert (select estoque_minimo from public.produtos where id = '00000000-0000-0000-0000-0000000000f1') = 200;
  assert exists (select 1 from public.produtos_estoque_baixo where id = '00000000-0000-0000-0000-0000000000f1');
end $$;

-- RN01: a base é o estoque total. Comprar 1 pote com 150 g em casa dá mínimo de ceil(115) = 115, não 100.
do $$ begin
  perform public.movimentar_estoque('00000000-0000-0000-0000-0000000000f1', 'entrada', 1000);
  assert (select estoque_minimo from public.produtos where id = '00000000-0000-0000-0000-0000000000f1') = 115;
  assert not exists (select 1 from public.produtos_estoque_baixo where id = '00000000-0000-0000-0000-0000000000f1');
end $$;

-- Arredonda para cima: 1151 g dá mínimo 116.
do $$ begin
  perform public.movimentar_estoque('00000000-0000-0000-0000-0000000000f1', 'entrada', 1);
  assert (select estoque_minimo from public.produtos where id = '00000000-0000-0000-0000-0000000000f1') = 116;
end $$;

-- Saída maior que o estoque é recusada.
do $$ begin
  perform public.movimentar_estoque('00000000-0000-0000-0000-0000000000f1', 'saida', 5000);
  raise exception 'deveria recusar saída maior que o estoque';
exception when others then
  assert sqlerrm = 'estoque_insuficiente', sqlerrm;
end $$;

-- Ajuste (contagem) grava a diferença; mínimo manual não é recalculado na entrada.
do $$ begin
  perform public.movimentar_estoque('00000000-0000-0000-0000-0000000000f1', 'ajuste', 1100, null, 'contagem de sábado');
  assert (select quantidade from public.movimentacoes_estoque where produto_id = '00000000-0000-0000-0000-0000000000f1' and tipo = 'ajuste') = -51;
  update public.produtos set estoque_minimo = 300, minimo_manual = true where id = '00000000-0000-0000-0000-0000000000f1';
  perform public.movimentar_estoque('00000000-0000-0000-0000-0000000000f1', 'entrada', 1000);
  assert (select estoque_minimo from public.produtos where id = '00000000-0000-0000-0000-0000000000f1') = 300;
  assert (select count(*) from public.movimentacoes_estoque where produto_id = '00000000-0000-0000-0000-0000000000f1') = 6;
  assert (select sum(quantidade) from public.movimentacoes_estoque where produto_id = '00000000-0000-0000-0000-0000000000f1') = 2100;
end $$;

-- Editar o saldo direto na tabela é bloqueado (o histórico tem de bater).
do $$ begin
  update public.produtos set estoque_atual = 1 where id = '00000000-0000-0000-0000-0000000000f1';
  raise exception 'deveria bloquear edição direta do saldo';
exception when others then
  assert sqlerrm = 'use_movimentar_estoque', sqlerrm;
end $$;

-- Cliente não movimenta estoque.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
do $$ begin
  perform public.movimentar_estoque('00000000-0000-0000-0000-0000000000f1', 'saida', 1);
  raise exception 'cliente não deveria movimentar';
exception when others then
  assert sqlerrm = 'sem_permissao', sqlerrm;
end $$;

rollback;
\echo 'estoque: todos os testes passaram'
