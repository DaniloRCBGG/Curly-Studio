-- Testes da baixa automática por atendimento. Rodar com: npm run test:db
\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'juliana@ex.com', '{}'),
  ('00000000-0000-0000-0000-0000000000e3', 'rita@ex.com', '{"origem":"autocadastro","nome":"Rita","telefone":"21999990009"}');
update public.usuarios set perfil = 'funcionaria' where id = '00000000-0000-0000-0000-0000000000e1';

insert into public.servicos (id, nome, duracao_minutos, valor, valor_sinal)
  values ('00000000-0000-0000-0000-0000000000c9', 'Hidratação', 60, 120, 30);
insert into public.funcionarias (id, nome, cargo, usuario_id)
  values ('00000000-0000-0000-0000-0000000000d9', 'Juliana', 'cabeleireira_auxiliar', '00000000-0000-0000-0000-0000000000e1');
insert into public.produtos (id, nome, unidade, tamanho_embalagem) values
  ('00000000-0000-0000-0000-0000000000f7', 'Máscara', 'g', 1000),
  ('00000000-0000-0000-0000-0000000000f8', 'Óleo', 'ml', 120);
insert into public.consumo_servico values
  ('00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000f7', 'M', 40),
  ('00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000f7', 'GG', 90),
  ('00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000f8', 'GG', 10);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select public.movimentar_estoque('00000000-0000-0000-0000-0000000000f7', 'entrada', 1000);
select public.movimentar_estoque('00000000-0000-0000-0000-0000000000f8', 'entrada', 5);

insert into public.agendamentos (id, cliente_id, funcionaria_id, servico_id, inicio, fim, status, valor, tamanho)
select '00000000-0000-0000-0000-0000000000a1', c.id, '00000000-0000-0000-0000-0000000000d9', '00000000-0000-0000-0000-0000000000c9',
       now() - interval '2 hours', now() - interval '1 hour', 'agendado', 120, 'GG'
  from public.clientes c where c.usuario_id = '00000000-0000-0000-0000-0000000000e3';
insert into public.agendamentos (id, cliente_id, funcionaria_id, servico_id, inicio, fim, status, valor)
select '00000000-0000-0000-0000-0000000000a2', c.id, '00000000-0000-0000-0000-0000000000d9', '00000000-0000-0000-0000-0000000000c9',
       now() - interval '4 hours', now() - interval '3 hours', 'agendado', 120
  from public.clientes c where c.usuario_id = '00000000-0000-0000-0000-0000000000e3';

-- Cabelo GG: 90 g de máscara; óleo só tinha 5 ml e zera, com aviso.
update public.agendamentos set status = 'concluido' where id = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  assert (select estoque_atual from public.produtos where id = '00000000-0000-0000-0000-0000000000f7') = 910;
  assert (select estoque_atual from public.produtos where id = '00000000-0000-0000-0000-0000000000f8') = 0;
  assert (select observacao from public.movimentacoes_estoque where agendamento_id = '00000000-0000-0000-0000-0000000000a1'
          and produto_id = '00000000-0000-0000-0000-0000000000f8') like '%conferir%';
end $$;

-- Concluir de novo não baixa duas vezes.
update public.agendamentos set status = 'concluido' where id = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  assert (select estoque_atual from public.produtos where id = '00000000-0000-0000-0000-0000000000f7') = 910;
end $$;

-- Sem tamanho no agendamento vale o consumo do cabelo M.
update public.agendamentos set status = 'concluido' where id = '00000000-0000-0000-0000-0000000000a2';
do $$ begin
  assert (select estoque_atual from public.produtos where id = '00000000-0000-0000-0000-0000000000f7') = 870;
end $$;

-- Cancelar não mexe no estoque.
update public.agendamentos set status = 'cancelado' where id = '00000000-0000-0000-0000-0000000000a2';
do $$ begin
  assert (select count(*) from public.movimentacoes_estoque where agendamento_id is not null) = 3;
end $$;

rollback;
\echo 'consumo: todos os testes passaram'
