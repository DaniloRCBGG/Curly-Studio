-- Dados de exemplo só para desenvolvimento local (npx supabase db reset).
-- Os serviços reais vêm de supabase/dados/tabela-de-servicos.sql, carregado antes deste arquivo.
insert into public.funcionarias (id, nome, cargo, modalidade, atende) values
  ('10000000-0000-0000-0000-000000000001', 'Carol Rios', 'gerente', null, true),
  ('10000000-0000-0000-0000-000000000002', 'Juliana', 'cabeleireira_auxiliar', 'comissao', true);
update public.funcionarias set percentual_comissao = 30 where cargo = 'cabeleireira_auxiliar';

-- A Carol faz todos os serviços; a Juliana, os de cuidados.
insert into public.funcionaria_servicos (funcionaria_id, servico_id)
select '10000000-0000-0000-0000-000000000001', id from public.servicos;
insert into public.funcionaria_servicos (funcionaria_id, servico_id)
select '10000000-0000-0000-0000-000000000002', id from public.servicos where grupo = 'cuidados';
